"""SQLite (WAL) persistence for scan runs.

WAL (Write-Ahead Logging) mode is enabled for better concurrency between the
GUI thread (reads) and the background scan thread (writes), and it keeps the
memory/IO footprint modest -- a good fit for constrained machines.

Only *analysis metadata* is stored (findings, counts, paths). No target source
code is persisted.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone

from core.models import Finding, ScanResult, Severity

_SCHEMA = """
CREATE TABLE IF NOT EXISTS scans (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    root          TEXT NOT NULL,
    created_at    TEXT NOT NULL,
    files_scanned INTEGER NOT NULL,
    total         INTEGER NOT NULL,
    critical      INTEGER NOT NULL DEFAULT 0,
    high          INTEGER NOT NULL DEFAULT 0,
    medium        INTEGER NOT NULL DEFAULT 0,
    low           INTEGER NOT NULL DEFAULT 0,
    info          INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS findings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id   INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    rule_id   TEXT NOT NULL,
    title     TEXT NOT NULL,
    severity  TEXT NOT NULL,
    cwe       TEXT NOT NULL,
    category  TEXT NOT NULL,
    file      TEXT NOT NULL,
    line      INTEGER NOT NULL,
    snippet   TEXT,
    remediation TEXT
);
CREATE INDEX IF NOT EXISTS idx_findings_scan ON findings(scan_id);
"""


class ScanStore:
    """Thin persistence layer around a SQLite database file."""

    def __init__(self, db_path: str = "analysis_results.db") -> None:
        self.db_path = db_path
        with self._connect() as conn:
            conn.executescript(_SCHEMA)

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA foreign_keys=ON;")
            conn.row_factory = sqlite3.Row
            yield conn
            conn.commit()
        finally:
            conn.close()

    def save(self, result: ScanResult) -> int:
        """Persist a scan result; return the new scan id."""
        counts = result.severity_counts()
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO scans (root, created_at, files_scanned, total, "
                "critical, high, medium, low, info) VALUES (?,?,?,?,?,?,?,?,?)",
                (
                    result.root,
                    datetime.now(timezone.utc).isoformat(timespec="seconds"),
                    result.files_scanned,
                    len(result.findings),
                    counts[Severity.CRITICAL], counts[Severity.HIGH],
                    counts[Severity.MEDIUM], counts[Severity.LOW],
                    counts[Severity.INFO],
                ),
            )
            scan_id = int(cur.lastrowid)
            conn.executemany(
                "INSERT INTO findings (scan_id, rule_id, title, severity, cwe, "
                "category, file, line, snippet, remediation) "
                "VALUES (?,?,?,?,?,?,?,?,?,?)",
                [
                    (scan_id, f.rule_id, f.title, f.severity.name, f.cwe,
                     f.category, f.file, f.line, f.snippet, f.remediation)
                    for f in result.findings
                ],
            )
        return scan_id

    def recent_scans(self, limit: int = 50) -> list[sqlite3.Row]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM scans ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return list(rows)

    def findings_for(self, scan_id: int) -> list[Finding]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM findings WHERE scan_id = ? "
                "ORDER BY severity DESC, file, line", (scan_id,)
            ).fetchall()
        return [
            Finding(
                rule_id=r["rule_id"], title=r["title"],
                severity=Severity.from_name(r["severity"]), cwe=r["cwe"],
                category=r["category"], file=r["file"], line=r["line"],
                snippet=r["snippet"] or "", remediation=r["remediation"] or "",
            )
            for r in rows
        ]
