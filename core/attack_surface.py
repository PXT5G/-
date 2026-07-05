"""Attack-surface mapper.

Enumerates *where untrusted input can enter* a program so it can be reviewed
during threat modelling. This is purely descriptive: it lists HTTP routes,
network binds, CLI/stdin inputs and environment reads. It does not probe,
attack, or reach out over the network.

Complexity: single AST traversal, ``O(N)`` in node count.
"""

from __future__ import annotations

import ast
from collections.abc import Iterator

from core.models import AttackSurfaceEntry
from core.vuln_analyzer import _dotted_name

# Decorators that expose an HTTP handler (Flask / FastAPI / APIRouter / Django REST).
_ROUTE_DECORATORS = {"route", "get", "post", "put", "delete", "patch",
                     "websocket", "api_route"}

# Calls that bind/serve on the network.
_NETWORK_CALLS = {"run", "bind", "serve_forever", "listen", "create_server"}


class _SurfaceVisitor(ast.NodeVisitor):
    def __init__(self, filename: str) -> None:
        self.filename = filename
        self.entries: list[AttackSurfaceEntry] = []

    def _add(self, kind: str, name: str, node: ast.AST, detail: str = "") -> None:
        self.entries.append(AttackSurfaceEntry(
            kind=kind, name=name, file=self.filename,
            line=getattr(node, "lineno", 0), detail=detail,
        ))

    def _decorator_name(self, dec: ast.AST) -> str | None:
        target = dec.func if isinstance(dec, ast.Call) else dec
        return _dotted_name(target)

    def _handle_route(self, func: ast.AST) -> None:
        for dec in getattr(func, "decorator_list", []):
            name = self._decorator_name(dec)
            if name is None:
                continue
            last = name.split(".")[-1]
            if last in _ROUTE_DECORATORS:
                path = ""
                if isinstance(dec, ast.Call) and dec.args:
                    first = dec.args[0]
                    if isinstance(first, ast.Constant):
                        path = str(first.value)
                self._add("http-route", path or f"@{name}", dec,
                          detail=f"handler '{getattr(func, 'name', '?')}' via @{name}")

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._handle_route(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._handle_route(node)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> None:
        name = _dotted_name(node.func)
        if name is not None:
            last = name.split(".")[-1]
            if last == "input":  # builtin stdin
                self._add("stdin", "input()", node, "reads from standard input")
            elif last in _NETWORK_CALLS and (
                    "." in name or last in {"run", "create_server"}):
                host = self._extract_host(node)
                self._add("network-bind", host or name, node,
                          f"network entry point via {name}()")
            elif name in {"os.getenv"} or name.endswith("environ.get"):
                key = ""
                if node.args and isinstance(node.args[0], ast.Constant):
                    key = str(node.args[0].value)
                self._add("environment", key or "os.environ", node,
                          "reads external configuration")
            elif last == "ArgumentParser":
                self._add("cli-args", "argparse", node, "command-line arguments")
        self.generic_visit(node)

    def _extract_host(self, node: ast.Call) -> str:
        host = port = None
        for kw in node.keywords:
            if kw.arg == "host" and isinstance(kw.value, ast.Constant):
                host = str(kw.value.value)
            elif kw.arg == "port" and isinstance(kw.value, ast.Constant):
                port = str(kw.value.value)
        if host or port:
            return f"{host or '?'}:{port or '?'}"
        return ""

    def visit_Attribute(self, node: ast.Attribute) -> None:
        name = _dotted_name(node)
        if name in {"sys.argv"}:
            self._add("cli-args", "sys.argv", node, "raw command-line arguments")
        self.generic_visit(node)


def map_attack_surface(source: str, filename: str = "<unknown>") -> Iterator[AttackSurfaceEntry]:
    """Yield attack-surface entries for one module's ``source``."""
    tree = ast.parse(source, filename=filename)
    visitor = _SurfaceVisitor(filename)
    visitor.visit(tree)
    yield from visitor.entries
