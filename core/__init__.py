"""Core analysis engine for the defensive code-analysis tool.

This package contains the framework-independent analysis logic:

- :mod:`core.models`         -- shared dataclasses / enums.
- :mod:`core.vuln_analyzer`  -- AST-based weakness detection (CWE mapped).
- :mod:`core.attack_surface` -- attack-surface / entry-point mapper.
- :mod:`core.architecture`   -- module dependency & structure mapper.
- :mod:`core.disassembler`   -- safe CPython bytecode disassembly.
- :mod:`core.storage`        -- SQLite (WAL) persistence for scan runs.
- :mod:`core.scanner`        -- orchestrates a full scan over a path.

The engine is intentionally *analytical and defensive only*: it detects,
explains and maps risky patterns. It never generates exploits, shellcode,
or evasion code, and it never executes the code under analysis.
"""

from core.models import (
    AttackSurfaceEntry,
    Dependency,
    Finding,
    ModuleInfo,
    ScanResult,
    Severity,
)

__all__ = [
    "AttackSurfaceEntry",
    "Dependency",
    "Finding",
    "ModuleInfo",
    "ScanResult",
    "Severity",
]

__version__ = "1.0.0"
