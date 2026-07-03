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
from typing import Any, Dict, List


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
class SecurityTelemetry:
    """
    Real-time Security Center metrics streamed to the GUI.

    SKILL BREAKDOWN: Operational Telemetry Design
    ---------------------------------------------
    Separating telemetry from core ``TaskState`` allows the dashboard to render
    high-frequency meter updates without cloning full task metadata each tick,
    reducing main-thread churn and accidental data races.
    """

    memory_entropy: float = 0.0
    memory_encrypted_ratio: float = 1.0
    network_entropy: float = 0.0
    jitter_frequency_hz: float = 0.0
    oob_heartbeat_ms: float = 0.0
    active_workers: int = 0
    fragmented_secrets: int = 0
    chaff_packets: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_entropy": round(self.memory_entropy, 4),
            "memory_encrypted_ratio": round(self.memory_encrypted_ratio, 4),
            "network_entropy": round(self.network_entropy, 4),
            "jitter_frequency_hz": round(self.jitter_frequency_hz, 2),
            "oob_heartbeat_ms": round(self.oob_heartbeat_ms, 1),
            "active_workers": self.active_workers,
            "fragmented_secrets": self.fragmented_secrets,
            "chaff_packets": self.chaff_packets,
        }


@dataclass
class WipeValidation:
    """
    Post-wipe validation artifact for GUI confirmation.

    SKILL BREAKDOWN: Anti-Forensics Verification
    ----------------------------------------------
    Operators require affirmative feedback that memory volatilization and DB
    purge completed; this struct captures counts without leaking wiped content.
    """

    memory_artifacts_cleared: int = 0
    fragments_destroyed: int = 0
    db_rows_purged: int = 0
    passes_executed: int = 0
    success: bool = False
    message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_artifacts_cleared": self.memory_artifacts_cleared,
            "fragments_destroyed": self.fragments_destroyed,
            "db_rows_purged": self.db_rows_purged,
            "passes_executed": self.passes_executed,
            "success": self.success,
            "message": self.message,
        }


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
    telemetry: SecurityTelemetry = field(default_factory=SecurityTelemetry)
    session_topology: List[str] = field(default_factory=list)
    wipe_validation: WipeValidation = field(default_factory=WipeValidation)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "active_threads": self.active_threads,
            "memory_entropy": round(self.memory_entropy, 4),
            "network_entropy": round(self.network_entropy, 4),
            "enabled_modes": dict(self.enabled_modes),
            "last_message": self.last_message,
            "metadata": dict(self.metadata),
            "telemetry": self.telemetry.to_dict(),
            "session_topology": list(self.session_topology),
            "wipe_validation": self.wipe_validation.to_dict(),
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
            telemetry=SecurityTelemetry(
                memory_entropy=self.telemetry.memory_entropy,
                memory_encrypted_ratio=self.telemetry.memory_encrypted_ratio,
                network_entropy=self.telemetry.network_entropy,
                jitter_frequency_hz=self.telemetry.jitter_frequency_hz,
                oob_heartbeat_ms=self.telemetry.oob_heartbeat_ms,
                active_workers=self.telemetry.active_workers,
                fragmented_secrets=self.telemetry.fragmented_secrets,
                chaff_packets=self.telemetry.chaff_packets,
            ),
            session_topology=list(self.session_topology),
            wipe_validation=WipeValidation(
                memory_artifacts_cleared=self.wipe_validation.memory_artifacts_cleared,
                fragments_destroyed=self.wipe_validation.fragments_destroyed,
                db_rows_purged=self.wipe_validation.db_rows_purged,
                passes_executed=self.wipe_validation.passes_executed,
                success=self.wipe_validation.success,
                message=self.wipe_validation.message,
            ),
        )
