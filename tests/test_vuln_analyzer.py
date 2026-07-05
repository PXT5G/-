"""Unit tests for the AST weakness detector."""

from __future__ import annotations

from core.models import Severity
from core.vuln_analyzer import analyze_source


def _rules(source: str) -> set[str]:
    return {f.rule_id for f in analyze_source(source, "t.py")}


def test_detects_eval_as_critical():
    findings = list(analyze_source("eval(x)", "t.py"))
    assert len(findings) == 1
    assert findings[0].rule_id == "PY-EVAL"
    assert findings[0].severity is Severity.CRITICAL
    assert findings[0].cwe == "CWE-95"


def test_detects_exec():
    assert "PY-EXEC" in _rules("exec(code)")


def test_detects_os_system_and_popen():
    assert "PY-OS-SYSTEM" in _rules("import os\nos.system('ls')")
    assert "PY-OS-POPEN" in _rules("import os\nos.popen('ls')")


def test_detects_subprocess_shell_true():
    src = "import subprocess\nsubprocess.call('ls ' + x, shell=True)"
    assert "PY-SUBPROCESS-SHELL" in _rules(src)


def test_subprocess_without_shell_is_clean():
    src = "import subprocess\nsubprocess.run(['ls', '-l'])"
    assert "PY-SUBPROCESS-SHELL" not in _rules(src)


def test_detects_pickle_and_marshal():
    assert "PY-PICKLE" in _rules("import pickle\npickle.loads(b)")
    assert "PY-MARSHAL" in _rules("import marshal\nmarshal.loads(b)")


def test_detects_unsafe_yaml_but_not_safe_load():
    assert "PY-YAML-LOAD" in _rules("import yaml\nyaml.load(t)")
    assert "PY-YAML-LOAD" not in _rules("import yaml\nyaml.safe_load(t)")
    assert "PY-YAML-LOAD" not in _rules(
        "import yaml\nyaml.load(t, Loader=yaml.SafeLoader)")


def test_detects_weak_hash():
    assert "PY-WEAK-HASH" in _rules("import hashlib\nhashlib.md5(b)")
    assert "PY-WEAK-HASH" in _rules("import hashlib\nhashlib.new('sha1')")
    assert "PY-WEAK-HASH" not in _rules("import hashlib\nhashlib.sha256(b)")


def test_detects_sql_injection_variants():
    assert "PY-SQL-INJECTION" in _rules("cur.execute('SELECT ' + x)")
    assert "PY-SQL-INJECTION" in _rules("cur.execute('SELECT %s' % x)")
    assert "PY-SQL-INJECTION" in _rules("cur.execute(f'SELECT {x}')")
    assert "PY-SQL-INJECTION" in _rules("cur.execute('SELECT {}'.format(x))")


def test_parameterised_query_is_clean():
    assert "PY-SQL-INJECTION" not in _rules("cur.execute('SELECT ?', (x,))")


def test_detects_hardcoded_secret():
    assert "PY-HARDCODED-SECRET" in _rules("API_KEY = 'abc123'")
    assert "PY-HARDCODED-SECRET" in _rules("password: str = 'hunter2'")
    assert "PY-HARDCODED-SECRET" not in _rules("API_KEY = os.environ['K']")


def test_detects_tls_noverify_and_unverified_context():
    assert "PY-TLS-NOVERIFY" in _rules("import requests\nrequests.get(u, verify=False)")
    assert "PY-SSL-UNVERIFIED" in _rules(
        "import ssl\nssl._create_unverified_context()")


def test_detects_world_writable_chmod():
    assert "PY-WORLD-WRITABLE" in _rules("import os\nos.chmod('f', 0o777)")
    assert "PY-WORLD-WRITABLE" not in _rules("import os\nos.chmod('f', 0o600)")


def test_syntax_error_propagates():
    import pytest
    with pytest.raises(SyntaxError):
        list(analyze_source("def (:", "t.py"))
