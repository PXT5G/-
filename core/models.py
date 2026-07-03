"""Shared, dependency-free data models for the analysis engine.

These are plain dataclasses / enums so that the core engine can be imported
and unit-tested without a GUI or any third-party dependency.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum


class Severity(IntEnum):
    """Ordered severity levels.

    ``IntEnum`` gives us free ordering/sorting (CRITICAL > HIGH > ...), which
    the UI relies on to sort findings by importance.
    """

    INFO = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

    @property
    def label(self) -> str:
        return self.name.capitalize()

    @property
    def color(self) -> str:
        """Semantic color used for severity mapping in the GUI (HCI cue)."""
        return {
            Severity.INFO: "#3B82F6",      # blue
            Severity.LOW: "#22C55E",       # green
            Severity.MEDIUM: "#EAB308",    # amber
            Severity.HIGH: "#F97316",      # orange
            Severity.CRITICAL: "#EF4444",  # red
        }[self]

    @classmethod
    def from_name(cls, name: str) -> Severity:
        return cls[name.strip().upper()]


@dataclass(slots=True)
class Finding:
    """A single detected weakness.

    ``slots=True`` keeps per-instance memory small, which matters when a large
    project yields thousands of findings on a memory-constrained machine.
    """

    rule_id: str
    title: str
    severity: Severity
    cwe: str
    category: str
    file: str
    line: int
    column: int = 0
    snippet: str = ""
    description: str = ""
    remediation: str = ""

    def to_row(self) -> tuple:
        return (
            self.severity.label,
            self.cwe,
            self.rule_id,
            f"{self.file}:{self.line}",
            self.title,
        )


@dataclass(slots=True)
class AttackSurfaceEntry:
    """A point where external / untrusted input can enter the program."""

    kind: str          # e.g. "http-route", "cli-arg", "network-bind"
    name: str          # e.g. "/login", "argparse", "0.0.0.0:8000"
    file: str
    line: int
    detail: str = ""


@dataclass(slots=True)
class Dependency:
    """A directed import edge between two modules (source -> target)."""

    source: str
    target: str
    external: bool = False


@dataclass(slots=True)
class ModuleInfo:
    """Structural summary of a single analysed module."""

    module: str
    file: str
    functions: int = 0
    classes: int = 0
    loc: int = 0
    imports: list[str] = field(default_factory=list)


@dataclass(slots=True)
class ScanResult:
    """Aggregated result of a scan over one or more files."""

    root: str
    files_scanned: int = 0
    findings: list[Finding] = field(default_factory=list)
    attack_surface: list[AttackSurfaceEntry] = field(default_factory=list)
    modules: list[ModuleInfo] = field(default_factory=list)
    dependencies: list[Dependency] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def severity_counts(self) -> dict[Severity, int]:
        counts = {level: 0 for level in Severity}
        for finding in self.findings:
            counts[finding.severity] += 1
        return counts

    def sorted_findings(self) -> list[Finding]:
        """Findings ordered by severity (desc), then file/line (asc)."""
        return sorted(
            self.findings,
            key=lambda f: (-int(f.severity), f.file, f.line),
        )
