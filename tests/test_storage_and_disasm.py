"""Tests for SQLite persistence and the bytecode disassembler."""

from __future__ import annotations

from core.disassembler import disassemble
from core.scanner import scan_path
from core.storage import ScanStore


def test_disassemble_contains_opcodes():
    lines = list(disassemble("def f(x):\n    return x + 1\n", "t.py"))
    text = "\n".join(lines)
    assert "Disassembly of t.py" in text
    assert "RETURN_VALUE" in text
    # nested function code object should be recursed into
    assert "code object 'f'" in text


def test_disassemble_syntax_error():
    import pytest
    with pytest.raises(SyntaxError):
        list(disassemble("def (:", "t.py"))


def test_store_roundtrip(tmp_path):
    db = str(tmp_path / "scans.db")
    (tmp_path / "app.py").write_text("eval(x)\nimport os\nos.system('y')")
    result = scan_path(str(tmp_path))

    store = ScanStore(db)
    scan_id = store.save(result)
    assert scan_id >= 1

    recent = store.recent_scans()
    assert len(recent) == 1
    assert recent[0]["total"] == len(result.findings)

    findings = store.findings_for(scan_id)
    assert {f.rule_id for f in findings} == {f.rule_id for f in result.findings}


def test_store_enables_wal(tmp_path):
    import sqlite3
    db = str(tmp_path / "wal.db")
    ScanStore(db)
    conn = sqlite3.connect(db)
    try:
        mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
    finally:
        conn.close()
    assert mode.lower() == "wal"
