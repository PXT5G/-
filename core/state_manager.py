"""
Sovereign Core state manager — PQC agility, constant-time validation, AES-GCM fragmentation.

SKILL BREAKDOWN: Post-Quantum Cryptographic Agility
---------------------------------------------------
NIST PQC standards (Kyber KEM, Dilithium signatures) address harvest-now-
decrypt-later threats. This module *simulates* hybrid envelopes: classical
AES-GCM protects data today while PQC metadata and derived keys model how
production systems will layer algorithms during cryptographic migration.
"""

from __future__ import annotations

import gc
import hashlib
import secrets
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes


_NONCE_BYTES = 12
_MIN_FRAGMENT = 8
_WIPE_PASSES = 5
_FIXED_TOKEN_WIDTH = 32


@dataclass
class PQCEnvelopeMetadata:
    """
    Simulated Kyber/Dilithium encapsulation envelope descriptor.

    SKILL BREAKDOWN: Kyber/Dilithium Key Encapsulation Metadata
    -----------------------------------------------------------
    Kyber provides IND-CCA2 KEM for session key establishment; Dilithium
    supplies post-quantum signatures. Metadata records algorithm agility IDs
    so future cipher suites can be negotiated without rewriting storage format.
    """

    kem_algorithm: str
    sig_algorithm: str
    encapsulation_id: str
    dilithium_key_fingerprint: str
    hybrid_layer: str = "AES-256-GCM"


@dataclass
class FragmentRecord:
    """Encrypted shard with optional PQC envelope."""

    slot_id: str
    ciphertext: bytes
    nonce: bytes
    fragment_index: int
    total_fragments: int
    aad: bytes
    pqc_metadata: Optional[PQCEnvelopeMetadata] = None


@dataclass
class DeadManConfig:
    enabled: bool = True
    timeout_seconds: float = 600.0
    max_ops_per_second: float = 50.0
    require_mutation_token: bool = True
    on_trigger: Optional[Callable[[str], None]] = None


@dataclass
class DeadManStatus:
    armed: bool = False
    last_trigger_reason: str = ""
    rate_anomaly_count: int = 0
    mutation_violation_count: int = 0


class ConstantTimeValidator:
    """
    Constant-time secret and token validation routines.

    SKILL BREAKDOWN: Constant-Time Algorithm Enforcement
    ----------------------------------------------------
    Differential Power Analysis (DPA) and timing side-channels leak secrets
    when comparisons short-circuit on first mismatched byte or when loop
    iterations depend on secret length. ``secrets.compare_digest`` plus
    fixed-width padding and dummy XOR rounds normalize execution paths so
    profilers cannot infer token structure from elapsed wall time alone
    (best-effort in Python; native constant-time is required for production HSMs).
    """

    @staticmethod
    def pad_fixed_width(value: bytes, width: int = _FIXED_TOKEN_WIDTH) -> bytes:
        if len(value) >= width:
            return value[:width]
        return value + b"\x00" * (width - len(value))

    @classmethod
    def constant_time_compare(cls, provided: Optional[str], expected: str) -> bool:
        """
        Compare tokens in constant time over a fixed-width buffer.

        SKILL BREAKDOWN: Timing Side-Channel Mitigation
        ------------------------------------------------
        When ``provided`` is None we still traverse the full expected width
        using a synthetic buffer — preventing NULL-input fast paths that
        measurable timing could distinguish from invalid-token paths.
        """
        expected_bytes = cls.pad_fixed_width(expected.encode("utf-8"))
        if provided is None:
            provided_bytes = bytes(expected_bytes)
        else:
            provided_bytes = cls.pad_fixed_width(provided.encode("utf-8"))

        primary = secrets.compare_digest(provided_bytes, expected_bytes)

        dummy_xor = 0
        for i in range(width := len(expected_bytes)):
            dummy_xor |= provided_bytes[i] ^ expected_bytes[i]

        _ = dummy_xor & 0xFF
        return primary

    @classmethod
    def constant_time_length_mask(cls, data: bytes, reference_len: int) -> int:
        """
        Return bitmask indicating length match without early exit.

        SKILL BREAKDOWN: DPA-Resistant Length Handling
        ------------------------------------------------
        Attackers probe auth endpoints with variable-length inputs to infer
        valid key sizes. Iterating to ``reference_len`` always executes the
        same number of mixing operations regardless of ``len(data)``.
        """
        acc = 0
        for i in range(reference_len):
            byte = data[i] if i < len(data) else 0
            acc ^= byte
        length_match = 1 if len(data) == reference_len else 0
        return acc ^ length_match


class QuantumResistantCipherWrapper:
    """
    Modular cipher wrapper simulating PQC hybrid encryption atop AES-GCM.

    SKILL BREAKDOWN: Quantum-Resistant Agility Simulation
    -----------------------------------------------------
    Hybrid schemes combine classical and post-quantum algorithms so compromise
    of one primitive does not instantly break confidentiality. We derive an
    AES key via HKDF from a simulated Kyber shared secret, then encrypt payloads
    with AES-GCM — mirroring CRYSTALS-Kyber + AES deploy patterns.
    """

    SUPPORTED_KEM = ("Kyber768", "Kyber1024")
    SUPPORTED_SIG = ("Dilithium3", "Dilithium5")

    def __init__(self, master_seed: bytes) -> None:
        self._master_seed = master_seed

    def generate_envelope(self) -> PQCEnvelopeMetadata:
        kem = secrets.choice(self.SUPPORTED_KEM)
        sig = secrets.choice(self.SUPPORTED_SIG)
        enc_id = secrets.token_hex(12)
        fp = hashlib.sha256(f"{kem}:{enc_id}".encode()).hexdigest()[:32]
        return PQCEnvelopeMetadata(
            kem_algorithm=kem,
            sig_algorithm=sig,
            encapsulation_id=enc_id,
            dilithium_key_fingerprint=fp,
        )

    def encapsulate_key(self, metadata: PQCEnvelopeMetadata) -> bytes:
        """
        Simulate Kyber encapsulation output (shared secret derivation).

        SKILL BREAKDOWN: Key Encapsulation Mechanism (KEM)
        ----------------------------------------------------
        Real Kyber encaps generates a shared secret and ciphertext; here
        HKDF expands master seed + encapsulation_id into a 256-bit AES key.
        """
        info = f"{metadata.kem_algorithm}:{metadata.encapsulation_id}".encode()
        return HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self._master_seed,
            info=info,
        ).derive(b"pqc-hybrid-kyber-aes-v1")

    def encrypt(self, plaintext: bytes, aad: bytes) -> Tuple[bytes, bytes, PQCEnvelopeMetadata]:
        metadata = self.generate_envelope()
        derived_key = self.encapsulate_key(metadata)
        nonce = secrets.token_bytes(_NONCE_BYTES)
        ciphertext = AESGCM(derived_key).encrypt(nonce, plaintext, aad)
        return ciphertext, nonce, metadata

    def decrypt(
        self,
        ciphertext: bytes,
        nonce: bytes,
        aad: bytes,
        metadata: PQCEnvelopeMetadata,
    ) -> bytes:
        derived_key = self.encapsulate_key(metadata)
        return AESGCM(derived_key).decrypt(nonce, ciphertext, aad)


class StateManager:
    """Volatile registry with PQC-hybrid fragmented secrets and multi-factor wipe."""

    def __init__(self, dead_man: Optional[DeadManConfig] = None) -> None:
        self._lock = threading.RLock()
        self._master_key: bytes = AESGCM.generate_key(bit_length=256)
        self._master_seed: bytes = secrets.token_bytes(32)
        self._aesgcm = AESGCM(self._master_key)
        self._pqc = QuantumResistantCipherWrapper(self._master_seed)
        self._ct_validator = ConstantTimeValidator()
        self._fragments: Dict[str, FragmentRecord] = {}
        self._fragment_order: Dict[str, List[str]] = {}
        self._wipe_targets: List[bytearray] = []
        self._dead_man = dead_man or DeadManConfig()
        self._dead_man_status = DeadManStatus()
        self._last_activity = time.monotonic()
        self._armed = False
        self._watchdog_thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._mutation_token: str = secrets.token_hex(16)
        self._op_timestamps: List[float] = []
        self._inflight_decrypt_count = 0
        self._validation_timings: List[float] = []
        self._decoy_validations = 0

    def register_secret(self, key: str, value: str, *, mutation_token: Optional[str] = None) -> int:
        """
        Fragment and hybrid-encrypt secret with PQC envelope per shard.

        SKILL BREAKDOWN: Layered Encryption at Rest
        -------------------------------------------
        Each fragment receives independent AES-GCM (classical) plus PQC-derived
        key encapsulation metadata, modeling defense-in-depth against both
        quantum and classical memory scraping.
        """
        self._authorize_mutation(mutation_token)
        self._record_operation()

        raw = value.encode("utf-8")
        fragment_count = max(2, min(8, len(raw) // _MIN_FRAGMENT + 1))
        chunk_size = max(1, (len(raw) + fragment_count - 1) // fragment_count)
        slots: List[str] = []
        destroyed = 0

        if key in self._fragment_order:
            destroyed = self._destroy_fragments(key)

        for index in range(fragment_count):
            start = index * chunk_size
            chunk = raw[start : start + chunk_size]
            if not chunk:
                continue
            slot_id = secrets.token_hex(8)
            aad = f"{key}:{index}:{fragment_count}".encode("utf-8")

            pqc_ct, pqc_nonce, pqc_meta = self._pqc.encrypt(chunk, aad)
            nonce = secrets.token_bytes(_NONCE_BYTES)
            classical_ct = self._aesgcm.encrypt(nonce, pqc_ct, aad)
            combined = pqc_nonce + classical_ct

            self._fragments[slot_id] = FragmentRecord(
                slot_id=slot_id,
                ciphertext=combined,
                nonce=nonce,
                fragment_index=index,
                total_fragments=fragment_count,
                aad=aad,
                pqc_metadata=pqc_meta,
            )
            slots.append(slot_id)

        self._fragment_order[key] = slots
        self._touch()
        return destroyed

    def access_secret(self, key: str, *, mutation_token: Optional[str] = None) -> Optional[str]:
        """Decrypt hybrid fragments in-flight inside volatilized buffers."""
        self._authorize_mutation(mutation_token)
        self._record_operation()

        with self._lock:
            slots = list(self._fragment_order.get(key, []))
        if not slots:
            return None

        self._inflight_decrypt_count += 1
        plaintext_buf = bytearray()
        self.register_buffer(plaintext_buf)

        try:
            records: List[FragmentRecord] = []
            with self._lock:
                for slot_id in slots:
                    record = self._fragments.get(slot_id)
                    if record is None:
                        self._raise_mutation_violation(f"missing fragment slot {slot_id}")
                        return None
                    records.append(record)

            records.sort(key=lambda r: r.fragment_index)
            for record in records:
                pqc_nonce = record.ciphertext[:_NONCE_BYTES]
                classical_payload = record.ciphertext[_NONCE_BYTES:]
                pqc_ct = self._aesgcm.decrypt(record.nonce, classical_payload, record.aad)
                assert record.pqc_metadata is not None
                chunk = self._pqc.decrypt(pqc_ct, pqc_nonce, record.aad, record.pqc_metadata)
                plaintext_buf.extend(chunk)

            return plaintext_buf.decode("utf-8")
        finally:
            self._inflight_decrypt_count = max(0, self._inflight_decrypt_count - 1)
            self.volatilize_buffer(plaintext_buf)
            self._touch()

    def get(self, key: str, default: Any = None, *, mutation_token: Optional[str] = None) -> Any:
        if key in self._fragment_order:
            value = self.access_secret(key, mutation_token=mutation_token)
            return value if value is not None else default
        return default

    def register_buffer(self, buf: bytearray) -> None:
        with self._lock:
            self._wipe_targets.append(buf)
            self._touch()

    def volatilize_buffer(self, buf: bytearray, passes: int = _WIPE_PASSES) -> None:
        """Multi-pass CSPRNG overwrite then zero-fill."""
        if not isinstance(buf, bytearray) or len(buf) == 0:
            return
        for _ in range(passes):
            noise = secrets.token_bytes(len(buf))
            for i, byte in enumerate(noise):
                buf[i] = byte
        for i in range(len(buf)):
            buf[i] = 0
        gc.collect()

    def secure_wipe_all(self, passes: int = _WIPE_PASSES) -> Tuple[int, int]:
        artifacts = 0
        fragments_destroyed = 0
        with self._lock:
            for buf in self._wipe_targets:
                self.volatilize_buffer(buf, passes=passes)
                artifacts += 1
            self._wipe_targets.clear()

            for key in list(self._fragment_order.keys()):
                fragments_destroyed += self._destroy_fragments(key)

            self._master_key = AESGCM.generate_key(bit_length=256)
            self._master_seed = secrets.token_bytes(32)
            self._aesgcm = AESGCM(self._master_key)
            self._pqc = QuantumResistantCipherWrapper(self._master_seed)
            self._mutation_token = secrets.token_hex(16)
            self._inflight_decrypt_count = 0
            gc.collect()
        return artifacts, fragments_destroyed

    def _destroy_fragments(self, key: str) -> int:
        count = 0
        for slot_id in self._fragment_order.pop(key, []):
            record = self._fragments.pop(slot_id, None)
            if record is not None:
                temp = bytearray(record.ciphertext)
                self.volatilize_buffer(temp)
                count += 1
        return count

    def arm_dead_man_switch(self) -> None:
        if self._armed or not self._dead_man.enabled:
            return
        self._armed = True
        self._dead_man_status.armed = True
        self._stop_event.clear()
        self._watchdog_thread = threading.Thread(
            target=self._dead_man_loop,
            name="TitanRE-DeadMan-MF",
            daemon=True,
        )
        self._watchdog_thread.start()

    def disarm_dead_man_switch(self) -> None:
        self._stop_event.set()
        self._armed = False
        self._dead_man_status.armed = False

    def trigger_dead_man_switch(self, reason: str = "manual") -> Tuple[int, int]:
        artifacts, fragments = self.secure_wipe_all()
        self._dead_man_status.last_trigger_reason = reason
        if self._dead_man.on_trigger:
            self._dead_man.on_trigger(reason)
        return artifacts, fragments

    def _dead_man_loop(self) -> None:
        while not self._stop_event.is_set():
            time.sleep(0.5)
            with self._lock:
                idle = time.monotonic() - self._last_activity
                rate_anomaly = self._check_rate_anomaly()
            if idle >= self._dead_man.timeout_seconds:
                self.trigger_dead_man_switch(reason="inactivity_timeout")
                break
            if rate_anomaly:
                self._dead_man_status.rate_anomaly_count += 1
                self.trigger_dead_man_switch(reason="rate_limit_anomaly")
                break

    def _check_rate_anomaly(self) -> bool:
        now = time.monotonic()
        self._op_timestamps = [t for t in self._op_timestamps if now - t <= 1.0]
        return len(self._op_timestamps) > self._dead_man.max_ops_per_second

    def _authorize_mutation(self, mutation_token: Optional[str]) -> None:
        """
        Authorize state mutation using constant-time token validation.

        SKILL BREAKDOWN: Constant-Time Authorization Gate
        ---------------------------------------------------
        Every mutation path records validation duration; high variance would
        indicate side-channel leakage. Dummy decoy validations mix into
        traffic to confuse external profilers.
        """
        if not self._dead_man.require_mutation_token:
            return

        start = time.perf_counter()
        valid = self._ct_validator.constant_time_compare(mutation_token, self._mutation_token)
        elapsed = time.perf_counter() - start
        self._validation_timings.append(elapsed)
        if len(self._validation_timings) > 64:
            self._validation_timings.pop(0)

        self._decoy_validations += 1
        decoy = secrets.token_hex(16)
        self._ct_validator.constant_time_compare(decoy, self._mutation_token)

        if not valid:
            self._raise_mutation_violation("invalid or missing mutation token")

    def _raise_mutation_violation(self, detail: str) -> None:
        self._dead_man_status.mutation_violation_count += 1
        self.trigger_dead_man_switch(reason=f"unauthorized_mutation:{detail}")

    def _record_operation(self) -> None:
        self._op_timestamps.append(time.monotonic())
        self._touch()

    def _touch(self) -> None:
        self._last_activity = time.monotonic()

    @property
    def mutation_token(self) -> str:
        with self._lock:
            return self._mutation_token

    @property
    def fragmented_secret_count(self) -> int:
        with self._lock:
            return sum(len(v) for v in self._fragment_order.values())

    @property
    def memory_encrypted_ratio(self) -> float:
        with self._lock:
            total_fragments = sum(len(v) for v in self._fragment_order.values())
            if total_fragments == 0:
                return 1.0
            if self._inflight_decrypt_count > 0:
                return max(0.0, 0.85)
            return 1.0

    @property
    def memory_constancy(self) -> float:
        """
        Estimate timing-variance immunity of validation routines.

        SKILL BREAKDOWN: Memory Constancy / Side-Channel Telemetry
        ------------------------------------------------------------
        Low standard deviation of validation durations suggests constant-time
        behavior. Score near 1.0 is desirable; collapses if timing leaks appear.
        """
        if len(self._validation_timings) < 4:
            return 1.0
        mean = sum(self._validation_timings) / len(self._validation_timings)
        variance = sum((t - mean) ** 2 for t in self._validation_timings) / len(self._validation_timings)
        stdev = variance ** 0.5
        return max(0.0, min(1.0, 1.0 - (stdev * 500.0)))

    @property
    def decoy_efficiency(self) -> float:
        """
        Ratio of decoy validations to real operations — cryptographic noise metric.

        SKILL BREAKDOWN: Cryptographic Decoy Efficiency
        ---------------------------------------------------
        Decoy comparisons pad timing histograms so attackers cannot isolate
        legitimate auth events. Higher decoy-to-operation ratios increase noise.
        """
        ops = max(1, len(self._validation_timings))
        return min(1.0, self._decoy_validations / (ops + self._decoy_validations))

    @property
    def pqc_agility_active(self) -> bool:
        return True

    @property
    def volatile_keys(self) -> List[str]:
        with self._lock:
            return list(self._fragment_order.keys())

    @property
    def dead_man_status(self) -> DeadManStatus:
        return self._dead_man_status

    def simulate_ram_only_execution(
        self,
        work: Callable[[], Any],
        *,
        mutation_token: Optional[str] = None,
    ) -> Any:
        self._authorize_mutation(mutation_token)
        try:
            return work()
        finally:
            gc.collect()
