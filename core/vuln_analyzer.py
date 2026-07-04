"""AST-based, defensive weakness detector for Python source.

Design notes
------------
* **Analytical only.** Detection is performed purely on the *Abstract Syntax
  Tree*; the target code is **never imported or executed**. ``ast.parse`` and
  ``compile`` do not run user code, so analysis is side-effect free.
* **Streaming.** :func:`analyze_source` is a generator that ``yield``\\s findings
  lazily, so callers can process (or discard) results without materialising a
  huge list -- helpful on memory-constrained machines.
* **Complexity.** A scan is a single traversal of the AST: ``O(N)`` time in the
  number of nodes and ``O(D)`` auxiliary space for the visitor recursion depth
  ``D`` (the tree height), plus ``O(1)`` per emitted finding.

Each rule maps to a CWE identifier so results can be triaged against a standard
taxonomy for threat-modelling and defensive documentation.
"""

from __future__ import annotations

import ast
from collections.abc import Iterator

from core.models import Finding, Severity

# Files larger than this are skipped by the higher-level scanner to bound memory.
MAX_SOURCE_BYTES = 2_000_000

# --- Rule lookup tables -------------------------------------------------------

# Dotted callables that are dangerous regardless of arguments.
_DANGEROUS_CALLS: dict[str, tuple[str, str, Severity, str, str]] = {
    # name: (rule_id, cwe, severity, title, remediation)
    "eval": ("PY-EVAL", "CWE-95", Severity.CRITICAL,
             "Use of eval() executes arbitrary code",
             "Avoid eval(); parse data explicitly (ast.literal_eval for literals)."),
    "exec": ("PY-EXEC", "CWE-95", Severity.CRITICAL,
             "Use of exec() executes arbitrary code",
             "Avoid exec(); refactor to explicit, non-dynamic logic."),
    "os.system": ("PY-OS-SYSTEM", "CWE-78", Severity.HIGH,
                  "os.system() invokes a shell",
                  "Use subprocess.run([...]) with an argument list and shell=False."),
    "os.popen": ("PY-OS-POPEN", "CWE-78", Severity.HIGH,
                 "os.popen() invokes a shell",
                 "Use subprocess.run([...]) with an argument list and shell=False."),
    "pickle.load": ("PY-PICKLE", "CWE-502", Severity.HIGH,
                    "Unpickling data can execute arbitrary code",
                    "Never unpickle untrusted data; use json or a safe schema."),
    "pickle.loads": ("PY-PICKLE", "CWE-502", Severity.HIGH,
                     "Unpickling data can execute arbitrary code",
                     "Never unpickle untrusted data; use json or a safe schema."),
    "marshal.loads": ("PY-MARSHAL", "CWE-502", Severity.MEDIUM,
                      "marshal.loads on untrusted data is unsafe",
                      "Do not deserialise untrusted data with marshal."),
    "tempfile.mktemp": ("PY-MKTEMP", "CWE-377", Severity.MEDIUM,
                        "tempfile.mktemp() is race-prone (insecure temp file)",
                        "Use tempfile.mkstemp() or NamedTemporaryFile()."),
    "ssl._create_unverified_context": (
        "PY-SSL-UNVERIFIED", "CWE-295", Severity.HIGH,
        "TLS certificate verification disabled",
        "Use the default verified SSL context; keep certificate checks on."),
}

# Weak hash constructors.
_WEAK_HASHES = {"md5", "sha1"}

# Names that suggest a secret when assigned a hard-coded string literal.
_SECRET_HINTS = ("password", "passwd", "secret", "api_key", "apikey",
                 "token", "access_key", "private_key")


def _dotted_name(node: ast.AST) -> str | None:
    """Return the dotted attribute path for a Name/Attribute node, else None.

    ``os.path.join`` -> ``"os.path.join"``; ``eval`` -> ``"eval"``.
    """
    parts: list[str] = []
    cur = node
    while isinstance(cur, ast.Attribute):
        parts.append(cur.attr)
        cur = cur.value
    if isinstance(cur, ast.Name):
        parts.append(cur.id)
        return ".".join(reversed(parts))
    return None


class _Visitor(ast.NodeVisitor):
    """Single-pass collector of findings for one module."""

    def __init__(self, filename: str, source_lines: list[str]) -> None:
        self.filename = filename
        self.source_lines = source_lines
        self.findings: list[Finding] = []

    # -- helpers -----------------------------------------------------------
    def _snippet(self, lineno: int) -> str:
        if 1 <= lineno <= len(self.source_lines):
            return self.source_lines[lineno - 1].strip()[:200]
        return ""

    def _add(self, node: ast.AST, rule_id: str, title: str, severity: Severity,
             cwe: str, category: str, description: str, remediation: str) -> None:
        line = getattr(node, "lineno", 0)
        self.findings.append(Finding(
            rule_id=rule_id, title=title, severity=severity, cwe=cwe,
            category=category, file=self.filename, line=line,
            column=getattr(node, "col_offset", 0),
            snippet=self._snippet(line), description=description,
            remediation=remediation,
        ))

    # -- visitors ----------------------------------------------------------
    def visit_Call(self, node: ast.Call) -> None:
        name = _dotted_name(node.func)
        if name is not None:
            self._check_dangerous_call(node, name)
            self._check_weak_hash(node, name)
            self._check_yaml_load(node, name)
            self._check_shell_subprocess(node, name)
            self._check_sql_execute(node, name)
            self._check_requests_noverify(node, name)
            self._check_insecure_chmod(node, name)
        self.generic_visit(node)

    def _check_dangerous_call(self, node: ast.Call, name: str) -> None:
        # Match either the full dotted path or the bare final attribute.
        key = name if name in _DANGEROUS_CALLS else name.split(".")[-1]
        # Only allow bare-name match for the builtins eval/exec/compile.
        if key not in _DANGEROUS_CALLS:
            return
        if key != name and key not in {"eval", "exec"}:
            # e.g. don't flag a random `.load()` method as pickle.load
            if name not in _DANGEROUS_CALLS:
                return
        rule_id, cwe, severity, title, remediation = _DANGEROUS_CALLS[key]
        self._add(node, rule_id, title, severity, cwe, "Injection / Deserialization",
                  f"Detected call to `{name}`.", remediation)

    def _check_weak_hash(self, node: ast.Call, name: str) -> None:
        last = name.split(".")[-1]
        if name.startswith("hashlib.") and last in _WEAK_HASHES:
            self._add(node, "PY-WEAK-HASH", f"Weak hash algorithm: {last}",
                      Severity.MEDIUM, "CWE-327", "Cryptography",
                      f"`{name}` is cryptographically broken for security use.",
                      "Use hashlib.sha256/sha3_256, or bcrypt/argon2 for passwords.")
        elif name == "hashlib.new" and node.args:
            arg = node.args[0]
            if isinstance(arg, ast.Constant) and isinstance(arg.value, str) \
                    and arg.value.lower() in _WEAK_HASHES:
                self._add(node, "PY-WEAK-HASH",
                          f"Weak hash algorithm: {arg.value}", Severity.MEDIUM,
                          "CWE-327", "Cryptography",
                          "hashlib.new() called with a broken algorithm.",
                          "Use a SHA-2/SHA-3 family algorithm instead.")

    def _check_yaml_load(self, node: ast.Call, name: str) -> None:
        if name not in {"yaml.load", "load"}:
            return
        if name == "load" and not _dotted_name(node.func) == "yaml.load":
            return
        # Safe if an explicit SafeLoader is provided.
        for kw in node.keywords:
            if kw.arg == "Loader":
                loader = _dotted_name(kw.value) or ""
                if "Safe" in loader or "CSafe" in loader:
                    return
        self._add(node, "PY-YAML-LOAD", "Unsafe yaml.load() can execute code",
                  Severity.HIGH, "CWE-502", "Injection / Deserialization",
                  "yaml.load without SafeLoader can construct arbitrary objects.",
                  "Use yaml.safe_load() or Loader=yaml.SafeLoader.")

    def _check_shell_subprocess(self, node: ast.Call, name: str) -> None:
        if not name.startswith("subprocess."):
            return
        for kw in node.keywords:
            if kw.arg == "shell" and isinstance(kw.value, ast.Constant) \
                    and kw.value.value is True:
                self._add(node, "PY-SUBPROCESS-SHELL",
                          "subprocess called with shell=True", Severity.HIGH,
                          "CWE-78", "Injection / Deserialization",
                          f"`{name}(shell=True)` allows shell metacharacter injection.",
                          "Pass an argument list and use shell=False (the default).")

    def _check_sql_execute(self, node: ast.Call, name: str) -> None:
        """Flag execute()/executemany() called with a dynamically built string."""
        if name.split(".")[-1] not in {"execute", "executemany"}:
            return
        if not node.args:
            return
        query = node.args[0]
        risky = isinstance(query, ast.BinOp) and isinstance(
            query.op, (ast.Add, ast.Mod))
        # f-strings (JoinedStr) with interpolation are also risky.
        if isinstance(query, ast.JoinedStr) and any(
                isinstance(v, ast.FormattedValue) for v in query.values):
            risky = True
        # ".format(" style, including on a string literal ("...".format(x)).
        if isinstance(query, ast.Call) and isinstance(query.func, ast.Attribute) \
                and query.func.attr == "format":
            risky = True
        if risky:
            self._add(node, "PY-SQL-INJECTION",
                      "Possible SQL injection (dynamic query string)",
                      Severity.HIGH, "CWE-89", "Injection / Deserialization",
                      "SQL built via string concatenation/formatting/f-string.",
                      "Use parameterised queries: execute(sql, (params,)).")

    def _check_requests_noverify(self, node: ast.Call, name: str) -> None:
        top = name.split(".")[0]
        if top not in {"requests", "httpx", "session"}:
            return
        for kw in node.keywords:
            if kw.arg == "verify" and isinstance(kw.value, ast.Constant) \
                    and kw.value.value is False:
                self._add(node, "PY-TLS-NOVERIFY",
                          "TLS verification disabled (verify=False)",
                          Severity.HIGH, "CWE-295", "Cryptography",
                          "Disabling verify exposes traffic to MITM attacks.",
                          "Leave verify=True and trust a proper CA bundle.")

    def _check_insecure_chmod(self, node: ast.Call, name: str) -> None:
        if name != "os.chmod" or len(node.args) < 2:
            return
        mode = node.args[1]
        if isinstance(mode, ast.Constant) and isinstance(mode.value, int) \
                and mode.value & 0o002:
            self._add(node, "PY-WORLD-WRITABLE",
                      "World-writable permissions via os.chmod", Severity.MEDIUM,
                      "CWE-732", "Access Control",
                      "Granting world-write permits tampering by any local user.",
                      "Restrict permissions (e.g. 0o600 / 0o750).")

    def visit_Assert(self, node: ast.Assert) -> None:
        self._add(node, "PY-ASSERT", "assert used for validation", Severity.LOW,
                  "CWE-617", "Logic",
                  "assert statements are stripped when Python runs with -O.",
                  "Use explicit error handling for security-relevant checks.")
        self.generic_visit(node)

    def _check_hardcoded_secret(self, target: ast.AST, value: ast.AST) -> None:
        name = None
        if isinstance(target, ast.Name):
            name = target.id
        elif isinstance(target, ast.Attribute):
            name = target.attr
        if name is None:
            return
        lname = name.lower()
        if not any(hint in lname for hint in _SECRET_HINTS):
            return
        if isinstance(value, ast.Constant) and isinstance(value.value, str) \
                and value.value.strip() != "":
            self._add(target, "PY-HARDCODED-SECRET",
                      f"Possible hard-coded secret in '{name}'", Severity.HIGH,
                      "CWE-798", "Secrets Management",
                      "Secret material appears to be embedded in source.",
                      "Load secrets from environment variables or a secrets manager.")

    def visit_Assign(self, node: ast.Assign) -> None:
        for target in node.targets:
            self._check_hardcoded_secret(target, node.value)
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        if node.value is not None:
            self._check_hardcoded_secret(node.target, node.value)
        self.generic_visit(node)


def analyze_source(source: str, filename: str = "<unknown>") -> Iterator[Finding]:
    """Yield findings for a single module's ``source``.

    Raises :class:`SyntaxError` if the source cannot be parsed; callers should
    catch it and record the file as an error.
    """
    tree = ast.parse(source, filename=filename)
    visitor = _Visitor(filename, source.splitlines())
    visitor.visit(tree)
    yield from visitor.findings
