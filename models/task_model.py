"""
Task and module state models for TitanRE — vulnerability flow extensions.

SKILL BREAKDOWN: Graph Theory / Vulnerability Path Modeling
-----------------------------------------------------------
``VulnerabilityPathNode`` vertices and ``FlowMatrixStep`` edges form a
directed execution graph operators can traverse in the Visual Flow Matrix —
mirroring how elite researchers chain Auth → Session → Resource steps to
surface BOLA and mass-assignment flaws.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any, Dict, List, Optional


class ModuleMode(Enum):
    STEALTH = auto()
    FUZZING = auto()
    ANALYSIS = auto()


class TaskStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    ABORTED = "aborted"


class VulnerabilityType(str, Enum):
    """API logic flaw classifications detected by the path tracer."""

    SAFE_PATH = "SAFE_PATH"
    SUSPICIOUS_JITTER = "SUSPICIOUS_JITTER"
    BOLA_IDOR = "BOLA/IDOR"
    MASS_ASSIGNMENT = "MASS_ASSIGNMENT"
    ERROR_PROPAGATION = "ERROR_PROPAGATION"


class FlowStepStatus(str, Enum):
    """Visual flow matrix node severity band."""

    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    CRITICAL = "CRITICAL"


@dataclass
class VulnerabilityPathNode:
    """
    Graph vertex for a detected vulnerability along an execution path.

    SKILL BREAKDOWN: Vulnerability Graph Modeling
    -----------------------------------------------
    Storing ``path_url``, typed flaw, severity, and ``remediation_vector`` per
    node enables both GUI highlighting and dependency routing when anomalies
    propagate across sequential API hops.
    """

    node_id: str
    path_url: str
    vulnerability_type: str
    severity_score: float
    remediation_vector: str
    step_index: int = 0
    propagated_from: Optional[str] = None
    evidence: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "path_url": self.path_url,
            "vulnerability_type": self.vulnerability_type,
            "severity_score": round(self.severity_score, 2),
            "remediation_vector": self.remediation_vector,
            "step_index": self.step_index,
            "propagated_from": self.propagated_from,
            "evidence": self.evidence,
        }


@dataclass
class FlowMatrixStep:
    """
    Single hop in the Visual Flow Matrix (e.g. SAFE PATH ➔ SUSPICIOUS ➔ CRITICAL).

    SKILL BREAKDOWN: Stateful Path Tracing
    ----------------------------------------
    Sequential steps model multi-hop API flows so analysts see *where* in the
    chain a flaw emerged rather than isolated per-request alerts.
    """

    label: str
    status: FlowStepStatus
    step_number: int = 0

    def display(self) -> str:
        return f"[{self.status.value} PATH] {self.label}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "status": self.status.value,
            "step_number": self.step_number,
            "display": self.display(),
        }


@dataclass
class VulnerabilityFlowState:
    """Aggregated vulnerability flow output for GUI rendering."""

    matrix_steps: List[FlowMatrixStep] = field(default_factory=list)
    path_nodes: List[VulnerabilityPathNode] = field(default_factory=list)
    trace_detail: str = ""
    matrix_line: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "matrix_steps": [s.to_dict() for s in self.matrix_steps],
            "path_nodes": [n.to_dict() for n in self.path_nodes],
            "trace_detail": self.trace_detail,
            "matrix_line": self.matrix_line,
        }


@dataclass
class ShardIntegrityStatus:
    quorum_met: bool = False
    shards_present: int = 0
    shards_required: int = 3
    jurisdictions: List[str] = field(default_factory=list)
    recovered_records: int = 0
    message: str = "Shard recovery pending."

    def to_dict(self) -> Dict[str, Any]:
        return {
            "quorum_met": self.quorum_met,
            "shards_present": self.shards_present,
            "shards_required": self.shards_required,
            "jurisdictions": list(self.jurisdictions),
            "recovered_records": self.recovered_records,
            "message": self.message,
        }


@dataclass
class SecurityTelemetry:
    memory_entropy: float = 0.0
    memory_encrypted_ratio: float = 1.0
    network_entropy: float = 0.0
    jitter_frequency_hz: float = 0.0
    oob_heartbeat_ms: float = 0.0
    active_workers: int = 0
    fragmented_secrets: int = 0
    chaff_packets: int = 0
    memory_constancy: float = 1.0
    decoy_efficiency: float = 0.0
    pqc_agility_active: bool = True
    tracker_poison_samples: int = 0
    vulnerability_count: int = 0
    max_severity: float = 0.0

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
            "memory_constancy": round(self.memory_constancy, 4),
            "decoy_efficiency": round(self.decoy_efficiency, 4),
            "pqc_agility_active": self.pqc_agility_active,
            "tracker_poison_samples": self.tracker_poison_samples,
            "vulnerability_count": self.vulnerability_count,
            "max_severity": round(self.max_severity, 2),
        }


@dataclass
class TopologyNode:
    node_id: str
    label: str
    tier: int = 0
    children: List["TopologyNode"] = field(default_factory=list)
    expanded: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "label": self.label,
            "tier": self.tier,
            "expanded": self.expanded,
            "children": [c.to_dict() for c in self.children],
        }


@dataclass
class WipeValidation:
    memory_artifacts_cleared: int = 0
    fragments_destroyed: int = 0
    db_rows_purged: int = 0
    shard_fragments_purged: int = 0
    passes_executed: int = 0
    success: bool = False
    message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "memory_artifacts_cleared": self.memory_artifacts_cleared,
            "fragments_destroyed": self.fragments_destroyed,
            "db_rows_purged": self.db_rows_purged,
            "shard_fragments_purged": self.shard_fragments_purged,
            "passes_executed": self.passes_executed,
            "success": self.success,
            "message": self.message,
        }


@dataclass
class TaskState:
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
    topology_tree: List[TopologyNode] = field(default_factory=list)
    vulnerability_flow: VulnerabilityFlowState = field(default_factory=VulnerabilityFlowState)
    wipe_validation: WipeValidation = field(default_factory=WipeValidation)
    shard_integrity: ShardIntegrityStatus = field(default_factory=ShardIntegrityStatus)

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
            "topology_tree": [n.to_dict() for n in self.topology_tree],
            "vulnerability_flow": self.vulnerability_flow.to_dict(),
            "wipe_validation": self.wipe_validation.to_dict(),
            "shard_integrity": self.shard_integrity.to_dict(),
        }

    def clone(self) -> "TaskState":
        def _clone_nodes(nodes: List[TopologyNode]) -> List[TopologyNode]:
            return [
                TopologyNode(
                    node_id=n.node_id,
                    label=n.label,
                    tier=n.tier,
                    expanded=n.expanded,
                    children=_clone_nodes(n.children),
                )
                for n in nodes
            ]

        def _clone_vuln_nodes(nodes: List[VulnerabilityPathNode]) -> List[VulnerabilityPathNode]:
            return [
                VulnerabilityPathNode(
                    node_id=n.node_id,
                    path_url=n.path_url,
                    vulnerability_type=n.vulnerability_type,
                    severity_score=n.severity_score,
                    remediation_vector=n.remediation_vector,
                    step_index=n.step_index,
                    propagated_from=n.propagated_from,
                    evidence=n.evidence,
                )
                for n in nodes
            ]

        vf = self.vulnerability_flow
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
                memory_constancy=self.telemetry.memory_constancy,
                decoy_efficiency=self.telemetry.decoy_efficiency,
                pqc_agility_active=self.telemetry.pqc_agility_active,
                tracker_poison_samples=self.telemetry.tracker_poison_samples,
                vulnerability_count=self.telemetry.vulnerability_count,
                max_severity=self.telemetry.max_severity,
            ),
            session_topology=list(self.session_topology),
            topology_tree=_clone_nodes(self.topology_tree),
            vulnerability_flow=VulnerabilityFlowState(
                matrix_steps=list(vf.matrix_steps),
                path_nodes=_clone_vuln_nodes(vf.path_nodes),
                trace_detail=vf.trace_detail,
                matrix_line=vf.matrix_line,
            ),
            wipe_validation=WipeValidation(
                memory_artifacts_cleared=self.wipe_validation.memory_artifacts_cleared,
                fragments_destroyed=self.wipe_validation.fragments_destroyed,
                db_rows_purged=self.wipe_validation.db_rows_purged,
                shard_fragments_purged=self.wipe_validation.shard_fragments_purged,
                passes_executed=self.wipe_validation.passes_executed,
                success=self.wipe_validation.success,
                message=self.wipe_validation.message,
            ),
            shard_integrity=ShardIntegrityStatus(
                quorum_met=self.shard_integrity.quorum_met,
                shards_present=self.shard_integrity.shards_present,
                shards_required=self.shard_integrity.shards_required,
                jurisdictions=list(self.shard_integrity.jurisdictions),
                recovered_records=self.shard_integrity.recovered_records,
                message=self.shard_integrity.message,
            ),
        )
