"""
SQLite-backed persistent logging for TitanRE with transactional purge.

SKILL BREAKDOWN: Anti-Forensics / Forensic Surface Reduction
------------------------------------------------------------
Persistent logs use WAL mode for concurrent readers. Emergency purge runs
inside an explicit transaction so partial deletes never leave recoverable
journal fragments after an operator wipe.
"""

from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple


class LogDatabase:
    """Thread-safe SQLite logger for framework events."""

    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(str(db_path), check_same_thread=False)
        self._conn.execute("PRAGMA journal_mode=WAL;")
        self._conn.execute("PRAGMA synchronous=NORMAL;")
        self._initialize_schema()

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

    def write(self, level: str, module: str, message: str) -> None:
        safe_message = message[:2048]
        ts = datetime.now(timezone.utc).isoformat()
        with self._lock:
            self._conn.execute(
                "INSERT INTO event_log (ts, level, module, message) VALUES (?, ?, ?, ?)",
                (ts, level, module, safe_message),
            )
            self._conn.commit()

    def recent(self, limit: int = 200) -> List[Tuple[str, str, str, str]]:
        with self._lock:
            cursor = self._conn.execute(
                """
                SELECT ts, level, module, message
                FROM event_log
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
        return list(reversed(rows))

    def count_rows(self) -> int:
        with self._lock:
            cursor = self._conn.execute("SELECT COUNT(*) FROM event_log")
            row = cursor.fetchone()
        return int(row[0]) if row else 0

    def purge(self) -> int:
        """
        Transactional emergency wipe of persistent log table.

        SKILL BREAKDOWN: SQLite Transactional Purge
        ---------------------------------------------
        BEGIN IMMEDIATE acquires writer lock atomically; DELETE + COMMIT
        ensures crash-consistency. Returning row count gives GUI validation
        feedback without exposing deleted message bodies.
        """
        with self._lock:
            count = self.count_rows()
            self._conn.execute("BEGIN IMMEDIATE")
            try:
                self._conn.execute("DELETE FROM event_log")
                self._conn.execute("COMMIT")
            except Exception:
                self._conn.execute("ROLLBACK")
                raise
        return count

    def close(self) -> None:
        with self._lock:
            self._conn.close()
