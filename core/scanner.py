"""Scan orchestrator: walks a path and runs every analyzer over it.

The file walker is a **generator** (:func:`iter_python_files`) so a large tree
is streamed one path at a time rather than materialised into a list -- keeping
memory flat regardless of project size.

A progress callback lets the GUI report status without the scanner knowing
anything about the UI (separation of concerns).
"""

from __future__ import annotations

import os
from collections.abc import Callable, Iterator

from core.architecture import analyze_structure, module_name_for
from core.attack_surface import map_attack_surface
from core.models import ScanResult
from core.vuln_analyzer import MAX_SOURCE_BYTES, analyze_source

# Directories that never contain first-party source worth analysing.
_SKIP_DIRS = {".git", ".venv", "venv", "__pycache__", "node_modules",
              ".mypy_cache", ".pytest_cache", ".ruff_cache", "build", "dist",
              ".tox", ".eggs"}

ProgressCb = Callable[[int, str], None]


def iter_python_files(root: str) -> Iterator[str]:
    """Yield ``.py`` file paths under ``root`` (or ``root`` itself if a file)."""
    if os.path.isfile(root):
        if root.endswith(".py"):
            yield root
        return
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skip dirs in-place so os.walk does not descend into them.
        dirnames[:] = [d for d in dirnames if d not in _SKIP_DIRS]
        for name in filenames:
            if name.endswith(".py"):
                yield os.path.join(dirpath, name)


def _read_source(path: str) -> str | None:
    try:
        if os.path.getsize(path) > MAX_SOURCE_BYTES:
            return None
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return None


def scan_path(root: str, progress: ProgressCb | None = None) -> ScanResult:
    """Run all analyzers over ``root`` and return an aggregated result."""
    root = os.path.abspath(root)
    base = root if os.path.isdir(root) else os.path.dirname(root)
    result = ScanResult(root=root)

    files = list(iter_python_files(root))
    local_modules = {module_name_for(p, base) for p in files}

    for index, path in enumerate(files, start=1):
        rel = os.path.relpath(path, base)
        if progress is not None:
            progress(int(index / max(len(files), 1) * 100), rel)

        source = _read_source(path)
        if source is None:
            result.errors.append(f"skipped (unreadable/too large): {rel}")
            continue

        try:
            result.findings.extend(analyze_source(source, rel))
            result.attack_surface.extend(map_attack_surface(source, rel))
            info, deps = analyze_structure(
                source, rel, module_name_for(path, base), local_modules)
            result.modules.append(info)
            result.dependencies.extend(deps)
        except SyntaxError as exc:
            result.errors.append(f"syntax error in {rel}: {exc.msg} (line {exc.lineno})")
        except (ValueError, RecursionError) as exc:
            result.errors.append(f"failed to parse {rel}: {exc}")

        result.files_scanned += 1

    return result
