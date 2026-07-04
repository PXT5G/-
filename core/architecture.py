"""Architecture mapper: module structure and import dependency graph.

Produces a :class:`~core.models.ModuleInfo` per file plus a list of directed
:class:`~core.models.Dependency` edges (source module -> imported module). The
GUI renders these as an interactive node graph; the data itself is a plain,
serialisable structure.

Complexity: ``O(N)`` AST traversal per module.
"""

from __future__ import annotations

import ast
import os

from core.models import Dependency, ModuleInfo


def module_name_for(path: str, root: str) -> str:
    """Derive a dotted module name from a file path relative to ``root``."""
    rel = os.path.relpath(path, root)
    rel = rel[:-3] if rel.endswith(".py") else rel
    parts = [p for p in rel.split(os.sep) if p and p != "."]
    if parts and parts[-1] == "__init__":
        parts.pop()
    return ".".join(parts) if parts else os.path.basename(path)


def analyze_structure(
    source: str,
    filename: str,
    module: str,
    local_modules: set[str] | None = None,
) -> tuple[ModuleInfo, list[Dependency]]:
    """Return (:class:`ModuleInfo`, dependency edges) for one module.

    ``local_modules`` lets us classify each import as internal (part of the
    scanned project) versus external (third-party / stdlib).
    """
    tree = ast.parse(source, filename=filename)
    local_modules = local_modules or set()

    functions = classes = 0
    imports: list[str] = []
    deps: list[Dependency] = []

    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            functions += 1
        elif isinstance(node, ast.AsyncFunctionDef):
            functions += 1
        elif isinstance(node, ast.ClassDef):
            classes += 1
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                imports.append(node.module)

    for imported in imports:
        top = imported.split(".")[0]
        is_external = not any(
            imported == m or imported.startswith(m + ".") or m.split(".")[0] == top
            for m in local_modules
        )
        deps.append(Dependency(source=module, target=imported, external=is_external))

    info = ModuleInfo(
        module=module,
        file=filename,
        functions=functions,
        classes=classes,
        loc=source.count("\n") + 1,
        imports=imports,
    )
    return info, deps
