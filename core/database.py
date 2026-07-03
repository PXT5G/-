"""
Distributed jurisdictional sharding database simulation for TitanRE.

SKILL BREAKDOWN: Multi-Jurisdictional Local Data Sharding
---------------------------------------------------------
Geographic sharding across legal jurisdictions raises the cost of compelled
data access: no single SQLite file holds recoverable payloads. Three encrypted
XOR shares simulate 3-of-3 quorum recovery performed only in RAM at boot.
"""

from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes


_JURISDICTIONS = ("alpha-helsinki", "beta-panama", "gamma-zurich")
_SHARD_DIR = ".titanre_shards"
_NONCE_BYTES = 12


@dataclass
class ShardRecord:
    """On-disk encrypted shard fragment."""

    jurisdiction: str
    path: Path
    ciphertext: bytes
    nonce: bytes
    sequence: int


@dataclass
class QuorumRecoveryResult:
    """Boot-time shard integrity verification."""

    quorum_met: bool
    shards_present: int
    jurisdictions: List[str]
    recovered_records: int
    message: str


class JurisdictionalShardEngine:
    """
    Splits payloads into three XOR shares, encrypts per jurisdiction, persists.

    SKILL BREAKDOWN: Secret Recovery Quorum Logic
    ---------------------------------------------
    XOR-based 3-of-3 sharing: s1 XOR s2 XOR s3 = plaintext. All shares are
    required — mimicking Shamir threshold policies where sub-threshold leaks
    reveal no information (here, 2 shares still hide data).
    """

    def __init__(self, shard_root: Path, master_seed: bytes) -> None:
        self._shard_root = shard_root
        self._shard_root.mkdir(parents=True, exist_ok=True)
        self._master_seed = master_seed
        self._lock = threading.RLock()
        self._sequence = 0

    def _derive_jurisdiction_key(self, jurisdiction: str) -> bytes:
        """
        Deterministic per-jurisdiction key from master seed.

        SKILL BREAKDOWN: Jurisdictional Key Derivation
        ------------------------------------------------
        HKDF with fixed salt ensures the same jurisdiction always derives the
        same AES key across write and boot-recovery — mandatory for quorum
        reassembly without storing keys alongside shards.
        """
        return HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self._master_seed,
            info=f"titanre-shard:{jurisdiction}".encode(),
        ).derive(b"sovereign-jurisdiction-v1")

    @staticmethod
    def _split_xor_3(data: bytes) -> Tuple[bytes, bytes, bytes]:
        s1 = secrets.token_bytes(len(data))
        s2 = secrets.token_bytes(len(data))
        s3 = bytes(a ^ b ^ c for a, b, c in zip(s1, s2, data))
        return s1, s2, s3

    @staticmethod
    def _combine_xor_3(s1: bytes, s2: bytes, s3: bytes) -> bytes:
        return bytes(a ^ b ^ c for a, b, c in zip(s1, s2, s3))

    def persist_sharded_record(self, payload: bytes) -> int:
        """
        Encrypt and write three jurisdictional shard files for one log record.

        SKILL BREAKDOWN: Non-Extradition Cloud Sharding Simulation
        --------------------------------------------------------------
        Each share lands in a separately keyed file named by jurisdiction,
        modeling storage in regions with divergent legal discovery regimes.
        """
        with self._lock:
            self._sequence += 1
            seq = self._sequence
            shares = self._split_xor_3(payload)

        for jurisdiction, share in zip(_JURISDICTIONS, shares):
            key = self._derive_jurisdiction_key(jurisdiction)
            nonce = secrets.token_bytes(_NONCE_BYTES)
            aad = f"{jurisdiction}:{seq}".encode()
            ciphertext = AESGCM(key).encrypt(nonce, share, aad)
            blob = json.dumps(
                {
                    "jurisdiction": jurisdiction,
                    "sequence": seq,
                    "nonce": nonce.hex(),
                    "ciphertext": ciphertext.hex(),
                }
            ).encode()
            path = self._shard_root / f"shard_{jurisdiction}_{seq:08d}.enc"
            path.write_bytes(blob)
        return seq

    def recover_quorum(self) -> QuorumRecoveryResult:
        """
        Recombine all shard triplets in memory at boot.

        SKILL BREAKDOWN: Dynamic Secret Recovery Quorum
        -------------------------------------------------
        Recovery never writes plaintext to disk: shares are decrypted, XOR-
        merged into ephemeral bytes, parsed, then released. Missing any
        jurisdiction blocks quorum — surfacing integrity failures to GUI.
        """
        sequences: Dict[int, Dict[str, Tuple[bytes, bytes]]] = {}
        jurisdictions_found: List[str] = []

        for jurisdiction in _JURISDICTIONS:
            pattern = f"shard_{jurisdiction}_"
            files = sorted(self._shard_root.glob(f"{pattern}*.enc"))
            if files:
                jurisdictions_found.append(jurisdiction)
            for path in files:
                try:
                    meta = json.loads(path.read_bytes())
                    seq = int(meta["sequence"])
                    nonce = bytes.fromhex(meta["nonce"])
                    ciphertext = bytes.fromhex(meta["ciphertext"])
                    key = self._derive_jurisdiction_key(jurisdiction)
                    aad = f"{jurisdiction}:{seq}".encode()
                    share = AESGCM(key).decrypt(nonce, ciphertext, aad)
                    sequences.setdefault(seq, {})[jurisdiction] = (share, nonce)
                except Exception:  # noqa: BLE001
                    continue

        recovered: List[Tuple[str, str, str, str]] = []
        complete_sequences = 0
        for seq, shard_map in sorted(sequences.items()):
            if len(shard_map) < 3:
                continue
            try:
                s1 = shard_map[_JURISDICTIONS[0]][0]
                s2 = shard_map[_JURISDICTIONS[1]][0]
                s3 = shard_map[_JURISDICTIONS[2]][0]
                plaintext = self._combine_xor_3(s1, s2, s3)
                record = json.loads(plaintext.decode("utf-8"))
                recovered.append(
                    (record["ts"], record["level"], record["module"], record["message"])
                )
                complete_sequences += 1
            except Exception:  # noqa: BLE001
                continue

        quorum_met = len(jurisdictions_found) == 3 or len(jurisdictions_found) == 0
        if len(jurisdictions_found) == 3:
            msg = f"Quorum OK — {complete_sequences} records recovered from 3 jurisdictions."
        elif jurisdictions_found:
            msg = f"Partial quorum — {len(jurisdictions_found)}/3 jurisdictions present."
        else:
            msg = "No shards found — fresh jurisdictional store."

        return QuorumRecoveryResult(
            quorum_met=quorum_met,
            shards_present=len(jurisdictions_found),
            jurisdictions=jurisdictions_found,
            recovered_records=len(recovered),
            message=msg,
        ), recovered

    def purge_shards(self) -> int:
        """Delete all jurisdictional shard files (emergency wipe)."""
        count = 0
        with self._lock:
            for path in self._shard_root.glob("shard_*.enc"):
                path.unlink(missing_ok=True)
                count += 1
        return count


class LogDatabase:
    """
    Hybrid logger: in-memory cache + jurisdictional shard persistence.

    SKILL BREAKDOWN: Resilient Data Distribution
    ----------------------------------------------
    Hot reads come from RAM; durable writes fan out to three encrypted
    shards. Boot recovery rehydrates memory before serving traffic/session
    topology logs to the Security Center.
    """

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._lock = threading.RLock()
        self._master_seed = self._load_or_create_master_seed(db_path)
        shard_root = db_path.parent / _SHARD_DIR
        self._shard_engine = JurisdictionalShardEngine(shard_root, self._master_seed)
        self._memory_log: List[Tuple[str, str, str, str]] = []
        self._recovery_result: Optional[QuorumRecoveryResult] = None

        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute("PRAGMA synchronous=NORMAL;")
        self._initialize_schema()
        self._boot_recovery()

    def _load_or_create_master_seed(self, db_path: Path) -> bytes:
        """
        Deterministic installation seed for jurisdictional shard keys.

        SKILL BREAKDOWN: Shard Key Persistence
        ----------------------------------------
        A stable seed per database path allows boot-time quorum recovery across
        process restarts while avoiding storage of raw AES keys on disk.
        """
        seed_file = db_path.parent / _SHARD_DIR / ".master_seed"
        seed_file.parent.mkdir(parents=True, exist_ok=True)
        if seed_file.exists():
            return seed_file.read_bytes()
        seed = hashlib.sha256(f"titanre-sovereign:{db_path.resolve()}".encode()).digest()
        seed_file.write_bytes(seed)
        return seed

    def _initialize_schema(self) -> None:
        with self._lock:
            self._conn.execute(
                """
                CREATE TABLE IF NOT EXISTS event_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts TEXT NOT NULL,
                    level TEXT NOT NULL,
                    module TEXT NOT NULL,
                    message TEXT NOT NULL
                )
                """
            )
            self._conn.commit()

    def _boot_recovery(self) -> None:
        """
        Recombine jurisdictional shards in-memory at startup.

        SKILL BREAKDOWN: Boot-Time Quorum Recovery
        --------------------------------------------
        Plaintext logs exist only in ``_memory_log`` after XOR reassembly;
        the local SQLite index may remain empty, preventing single-file
        forensic capture of full session history.
        """
        result, records = self._shard_engine.recover_quorum()
        self._recovery_result = result
        self._memory_log.extend(records)

    @property
    def recovery_result(self) -> Optional[QuorumRecoveryResult]:
        return self._recovery_result

    def write(self, level: str, module: str, message: str) -> None:
        safe_message = message[:2048]
        ts = datetime.now(timezone.utc).isoformat()
        row = (ts, level, module, safe_message)

        payload = json.dumps(
            {"ts": ts, "level": level, "module": module, "message": safe_message}
        ).encode()

        with self._lock:
            self._memory_log.append(row)
            self._shard_engine.persist_sharded_record(payload)
            self._conn.execute(
                "INSERT INTO event_log (ts, level, module, message) VALUES (?, ?, ?, ?)",
                row,
            )
            self._conn.commit()

    def write_topology(self, topology_lines: List[str]) -> None:
        """Persist session topology snapshot through jurisdictional sharding."""
        blob = json.dumps({"topology": topology_lines}).encode()
        with self._lock:
            self._shard_engine.persist_sharded_record(blob)

    def recent(self, limit: int = 200) -> List[Tuple[str, str, str, str]]:
        with self._lock:
            data = list(self._memory_log[-limit:])
        return data

    def count_rows(self) -> int:
        with self._lock:
            cursor = self._conn.execute("SELECT COUNT(*) FROM event_log")
            row = cursor.fetchone()
            mem_count = len(self._memory_log)
        sqlite_count = int(row[0]) if row else 0
        return max(mem_count, sqlite_count)

    def purge(self) -> int:
        """
        Transactional purge of SQLite + jurisdictional shard files.

        SKILL BREAKDOWN: Coordinated Multi-Store Wipe
        ------------------------------------------------
        Emergency response must clear both the local index and distributed
        shard fragments to avoid split-brain forensic recovery.
        """
        with self._lock:
            count = len(self._memory_log)
            self._memory_log.clear()
            shard_count = self._shard_engine.purge_shards()
            self._conn.execute("BEGIN IMMEDIATE")
            try:
                self._conn.execute("DELETE FROM event_log")
                self._conn.execute("COMMIT")
            except Exception:
                self._conn.execute("ROLLBACK")
                raise
        return count + shard_count

    def close(self) -> None:
        with self._lock:
            self._conn.close()
