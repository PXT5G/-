"""
Task and module state models for TitanRE MVC layer.

SKILL BREAKDOWN: Protocol Logic Analysis
----------------------------------------
Explicit enumerations for module modes and task lifecycle prevent ambiguous
string comparisons across threads. When GUI, controller, and async workers
share state, typed enums reduce race-induced misinterpretation of task status
and make protocol-state transitions auditable in logs.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Dict, Optional


class ModuleMode(Enum):
    """Operational modes toggled from the GUI module panel."""

    STEALTH = auto()
    FUZZING = auto()
    ANALYSIS = auto()


class TaskStatus(Enum):
    """Lifecycle states for background jobs."""

    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    ABORTED = "aborted"


@dataclass
class TaskState:
    """
    Thread-safe snapshot of runtime metrics surfaced in the dashboard.

    SKILL BREAKDOWN: Anti-Forensics / State Hygiene
    -------------------------------------------------
    Keeping volatile metrics in a dedicated dataclass (rather than scattered
  globals) localizes what must be wiped by the Dead-Man's Switch. The
    ``to_dict`` helper supports logging without exposing internal references.
    """

    status: TaskStatus = TaskStatus.IDLE
    active_threads: int = 0
    memory_entropy: float = 0.0
    network_entropy: float = 0.0
    enabled_modes: Dict[str, bool] = field(
        default_factory=lambda: {
            ModuleMode.STEALTH.name: True,
            ModuleMode.FUZZING.name: False,
            ModuleMode.ANALYSIS.name: False,
        }
    )
    last_message: str = "System initialized."
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "active_threads": self.active_threads,
            "memory_entropy": round(self.memory_entropy, 4),
            "network_entropy": round(self.network_entropy, 4),
            "enabled_modes": dict(self.enabled_modes),
            "last_message": self.last_message,
            "metadata": dict(self.metadata),
        }

    def clone(self) -> "TaskState":
        return TaskState(
            status=self.status,
            active_threads=self.active_threads,
            memory_entropy=self.memory_entropy,
            network_entropy=self.network_entropy,
            enabled_modes=dict(self.enabled_modes),
            last_message=self.last_message,
            metadata=dict(self.metadata),
        )
