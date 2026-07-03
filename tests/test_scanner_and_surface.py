"""Tests for the scanner orchestrator, attack surface and architecture mappers."""

from __future__ import annotations

import os

from core.architecture import analyze_structure, module_name_for
from core.attack_surface import map_attack_surface
from core.scanner import iter_python_files, scan_path

SAMPLE = os.path.join(os.path.dirname(__file__), "..", "sample_target",
                      "vulnerable_app.py")


def test_attack_surface_finds_routes_and_bind():
    src = (
        "from flask import Flask\n"
        "app = Flask(__name__)\n"
        "@app.route('/login')\n"
        "def login():\n"
        "    return 'x'\n"
        "app.run(host='0.0.0.0', port=8000)\n"
    )
    kinds = {(e.kind, e.name) for e in map_attack_surface(src, "a.py")}
    assert ("http-route", "/login") in kinds
    assert ("network-bind", "0.0.0.0:8000") in kinds


def test_attack_surface_cli_and_stdin():
    src = "import argparse\nx = input()\np = argparse.ArgumentParser()\n"
    kinds = {e.kind for e in map_attack_surface(src, "a.py")}
    assert "stdin" in kinds
    assert "cli-args" in kinds


def test_architecture_classifies_internal_vs_external():
    src = "import os\nimport core.models\n"
    info, deps = analyze_structure(src, "pkg/a.py", "pkg.a", {"core.models", "pkg.a"})
    targets = {d.target: d.external for d in deps}
    assert targets["os"] is True
    assert targets["core.models"] is False
    assert info.functions == 0


def test_module_name_for():
    root = "/proj"
    assert module_name_for("/proj/pkg/mod.py", root) == "pkg.mod"
    assert module_name_for("/proj/pkg/__init__.py", root) == "pkg"


def test_iter_python_files_skips_venv(tmp_path):
    (tmp_path / "keep.py").write_text("x = 1")
    venv = tmp_path / ".venv"
    venv.mkdir()
    (venv / "skip.py").write_text("y = 2")
    found = {os.path.basename(p) for p in iter_python_files(str(tmp_path))}
    assert found == {"keep.py"}


def test_scan_sample_target_reports_expected_findings():
    result = scan_path(SAMPLE)
    assert result.files_scanned == 1
    rules = {f.rule_id for f in result.findings}
    for expected in {"PY-EVAL", "PY-SUBPROCESS-SHELL", "PY-SQL-INJECTION",
                     "PY-PICKLE", "PY-YAML-LOAD", "PY-WEAK-HASH",
                     "PY-HARDCODED-SECRET"}:
        assert expected in rules
    assert any(e.kind == "http-route" for e in result.attack_surface)


def test_scan_directory_streams_and_aggregates(tmp_path):
    (tmp_path / "one.py").write_text("eval(a)")
    (tmp_path / "two.py").write_text("import os\nos.system('x')")
    (tmp_path / "bad.py").write_text("def (:")  # syntax error -> recorded
    result = scan_path(str(tmp_path))
    assert result.files_scanned == 3
    assert {"PY-EVAL", "PY-OS-SYSTEM"} <= {f.rule_id for f in result.findings}
    assert any("syntax error" in e for e in result.errors)
