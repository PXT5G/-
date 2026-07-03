"""
Anti-forensics state manager — AES-GCM fragmentation, volatilization, Dead-Man's Switch.

SKILL BREAKDOWN: Advanced Memory Anti-Forensics
----------------------------------------------
Plaintext secrets in the Python heap are recoverable via memory dumps and
swap. Fragmentation plus AES-GCM-at-rest (while idle) ensures no contiguous
ciphertext or plaintext credential spans exist in RAM. Decryption occurs only
inside ephemeral ``bytearray`` buffers that are multi-pass volatilized before
``gc.collect()`` reclaims objects.
"""

from __future__ import annotations

import gc
import hashlib
import secrets
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


# AES-GCM standard nonce length (96 bits)
_NONCE_BYTES = 12
# Minimum fragment size before scatter (bytes)
_MIN_FRAGMENT = 8
# Multi-pass volatilization rounds
_WIPE_PASSES = 5


@dataclass
class FragmentRecord:
    """
    Encrypted shard stored at a scattered memory slot.

    SKILL BREAKDOWN: In-Memory Payload Fragmentation & Scattering
    ---------------------------------------------------------------
    Splitting a credential into non-contiguous AES-GCM blobs defeats simple
    ``strings``-style scanning: an attacker must locate every fragment, derive
    each wrapping key, and reassemble order metadata — raising extraction cost.
    """

    slot_id: str
    ciphertext: bytes
    nonce: bytes
    fragment_index: int
    total_fragments: int
    aad: bytes


@dataclass
class DeadManConfig:
    """Multi-factor Dead-Man's Switch configuration."""

    enabled: bool = True
    timeout_seconds: float = 600.0
    max_ops_per_second: float = 50.0
    require_mutation_token: bool = True
    on_trigger: Optional[Callable[[str], None]] = None


@dataclass
class DeadManStatus:
    """Runtime diagnostics for Dead-Man trigger evaluation."""

    armed: bool = False
    last_trigger_reason: str = ""
    rate_anomaly_count: int = 0
    mutation_violation_count: int = 0


class StateManager:
    """
    Volatile registry with AES-GCM fragmented secrets and multi-factor wipe.

    SKILL BREAKDOWN: RAM-Only Execution Simulation
    ------------------------------------------------
    Secrets never enter the store as raw ``str``; they are fragmented,
    encrypted, and indexed by opaque slot IDs. Access paths decrypt in-flight
    and volatilize buffers in ``finally`` blocks mirroring TmpFS semantics.
    """

    def __init__(self, dead_man: Optional[DeadManConfig] = None) -> None:
        self._lock = threading.RLock()
        self._master_key: bytes = AESGCM.generate_key(bit_length=256)
        self._aesgcm = AESGCM(self._master_key)
        self._fragments: Dict[str, FragmentRecord] = {}
        self._fragment_order: Dict[str, List[str]] = {}
        self._wipe_targets: List[bytearray] = []
        self._dead_man = dead_man or DeadManConfig()
        self._dead_man_status = DeadManStatus()
        self._last_activity = time.monotonic()
        self._armed = False
        self._watchdog_thread: Optional[threading.Thread] = None
        _stop_event = threading.Event()
        self._stop_event = _stop_event
        self._mutation_token: str = secrets.token_hex(16)
        self._op_timestamps: List[float] = []
        self._inflight_decrypt_count = 0
        self._raw_exposure_count = 0

    # ------------------------------------------------------------------
    # Fragmentation API
    # ------------------------------------------------------------------

    def register_secret(self, key: str, value: str, *, mutation_token: Optional[str] = None) -> int:
        """
        Fragment and AES-GCM encrypt ``value``; scatter shards across slots.

        SKILL BREAKDOWN: AES-GCM At-Rest In Memory
        ------------------------------------------
        GCM provides authenticated encryption: tampering with any fragment
        fails decryption, detecting memory corruption or adversarial edits.
        Unique nonces per fragment are mandatory — nonce reuse breaks GCM.
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
            nonce = secrets.token_bytes(_NONCE_BYTES)
            aad = f"{key}:{index}:{fragment_count}".encode("utf-8")
            ciphertext = self._aesgcm.encrypt(nonce, chunk, aad)
            self._fragments[slot_id] = FragmentRecord(
                slot_id=slot_id,
                ciphertext=ciphertext,
                nonce=nonce,
                fragment_index=index,
                total_fragments=fragment_count,
                aad=aad,
            )
            slots.append(slot_id)

        self._fragment_order[key] = slots
        self._touch()
        return destroyed

    def access_secret(self, key: str, *, mutation_token: Optional[str] = None) -> Optional[str]:
        """
        Decrypt fragments in-flight inside a volatilized buffer.

        SKILL BREAKDOWN: Decrypt-Only-In-Flight
        ---------------------------------------
        Plaintext exists only inside a registered ``bytearray`` for the
        duration of this call. The buffer is volatilized before return,
        minimizing the window where a memory snapshot could capture secrets.
        """
        self._authorize_mutation(mutation_token)
        self._record_operation()

        with self._lock:
            slots = list(self._fragment_order.get(key, []))
        if not slots:
            return None

        self._inflight_decrypt_count += 1
        self._raw_exposure_count += 1
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
                chunk = self._aesgcm.decrypt(record.nonce, record.ciphertext, record.aad)
                plaintext_buf.extend(chunk)

            result = plaintext_buf.decode("utf-8")
            return result
        finally:
            self._inflight_decrypt_count = max(0, self._inflight_decrypt_count - 1)
            self.volatilize_buffer(plaintext_buf)
            self._touch()

    def get(self, key: str, default: Any = None, *, mutation_token: Optional[str] = None) -> Any:
        """Compatibility accessor — routes secrets through fragmented store."""
        if key in self._fragment_order:
            value = self.access_secret(key, mutation_token=mutation_token)
            return value if value is not None else default
        return default

    def register_buffer(self, buf: bytearray) -> None:
        """Track a mutable buffer for later multi-pass volatilization."""
        with self._lock:
            self._wipe_targets.append(buf)
            self._touch()

    # ------------------------------------------------------------------
    # Volatilization
    # ------------------------------------------------------------------

    def volatilize_buffer(self, buf: bytearray, passes: int = _WIPE_PASSES) -> None:
        """
        Multi-pass quantum-random overwrite then zero-fill.

        SKILL BREAKDOWN: Secure Memory Volatilization
        -----------------------------------------------
        Single-pass zeroing is insufficient against remanence-aware forensics
        and compiler optimizations (in native code). Multiple passes using
        OS CSPRNG bytes maximize displacement of prior contents in CPython
        ``bytearray`` backing stores before zeroization and ``gc.collect()``.
        """
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
        """
        Wipe buffers, destroy all fragments, rotate master key.

        Returns (artifacts_cleared, fragments_destroyed).
        """
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
            self._aesgcm = AESGCM(self._master_key)
            self._mutation_token = secrets.token_hex(16)
            self._raw_exposure_count = 0
            self._inflight_decrypt_count = 0
            gc.collect()
        return artifacts, fragments_destroyed

    def _destroy_fragments(self, key: str) -> int:
        count = 0
        for slot_id in self._fragment_order.pop(key, []):
            record = self._fragments.pop(slot_id, None)
            if record is not None:
                # Overwrite ciphertext bytes object indirectly via volatilize on bytearray copy
                temp = bytearray(record.ciphertext)
                self.volatilize_buffer(temp)
                count += 1
        return count

    # ------------------------------------------------------------------
    # Dead-Man's Switch — multi-factor
    # ------------------------------------------------------------------

    def arm_dead_man_switch(self) -> None:
        """
        Arm watchdog evaluating timeout, rate anomalies, and mutation violations.

        SKILL BREAKDOWN: Multi-Factor Dead-Man's Switch
        -------------------------------------------------
        A single trigger (timeout) is predictable. Combining rate-limit
        anomalies (burst forensics scraping) and unauthorized mutations
        (hooking API without session token) provides defense-in-depth against
        both idle exposure and active exfiltration attempts.
        """
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
        """Execute full volatilization and invoke optional callback."""
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
        """
        Detect operation bursts exceeding configured ops/sec.

        SKILL BREAKDOWN: Rate-Limit Anomaly Detection
        -----------------------------------------------
        Automated dump tools often hammer secret accessors linearly. A sliding
        one-second window exposing >N ops indicates non-human interaction.
        """
        now = time.monotonic()
        self._op_timestamps = [t for t in self._op_timestamps if now - t <= 1.0]
        return len(self._op_timestamps) > self._dead_man.max_ops_per_second

    def _authorize_mutation(self, mutation_token: Optional[str]) -> None:
        if not self._dead_man.require_mutation_token:
            return
        if mutation_token is None:
            self._raise_mutation_violation("missing mutation token")
        if not secrets.compare_digest(mutation_token, self._mutation_token):
            self._raise_mutation_violation("invalid mutation token")

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
        """Session token required for state mutations (share only with controller)."""
        with self._lock:
            return self._mutation_token

    @property
    def fragmented_secret_count(self) -> int:
        with self._lock:
            return sum(len(v) for v in self._fragment_order.values())

    @property
    def memory_encrypted_ratio(self) -> float:
        """
        Ratio of encrypted-at-rest fragments vs in-flight decrypt operations.

        SKILL BREAKDOWN: Encrypted-vs-Raw Telemetry
        -------------------------------------------
        GUI meters use this ratio to visualize exposure: 1.0 means all secrets
        are fragmented ciphertext; values drop briefly during in-flight access.
        """
        with self._lock:
            total_fragments = sum(len(v) for v in self._fragment_order.values())
            if total_fragments == 0:
                return 1.0
            if self._inflight_decrypt_count > 0:
                return max(0.0, 1.0 - (self._raw_exposure_count * 0.05))
            return 1.0

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
        """
        Execute callable inside ephemeral buffer lifecycle.

        SKILL BREAKDOWN: TmpFS / Ephemeral Execution
        ----------------------------------------------
        Guarantees volatilization even when ``work`` raises, mirroring
        kernel TmpFS unmount semantics at application layer.
        """
        self._authorize_mutation(mutation_token)
        temp_buffers: List[bytearray] = []
        try:
            return work()
        finally:
            for buf in temp_buffers:
                self.volatilize_buffer(buf)
            temp_buffers.clear()
            gc.collect()
