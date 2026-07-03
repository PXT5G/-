"""
Vulnerability Path & Logic Flow Mapping Engine for TitanRE.

SKILL BREAKDOWN: Stateful Path & Vulnerability Flow Mapping
-----------------------------------------------------------
Mapping sequential execution (Auth → Session Token → Resource Access) as a
directed graph lets researchers correlate anomalies across hops — exposing
BOLA/IDOR and mass-assignment flaws that only manifest after authentication.
"""

from __future__ import annotations

import heapq
import json
import random
import re
import secrets
import string
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from models.task_model import (
    FlowMatrixStep,
    FlowStepStatus,
    VulnerabilityFlowState,
    VulnerabilityPathNode,
    VulnerabilityType,
)


class MutationStrategy(Enum):
    BOUNDARY = "boundary"
    TYPE_JITTER = "type_jitter"
    LENGTH_SPIKE = "length_spike"
    SEMANTIC_NOISE = "semantic_noise"
    FORMAT_PROBE = "format_probe"
    DEPENDENCY_WALK = "dependency_walk"
    IDOR_PROBE = "idor_probe"
    MASS_ASSIGN = "mass_assign"


@dataclass
class DependencyNode:
    path: str
    value_type: str
    depth: int
    parent: Optional[str] = None
    children: List[str] = field(default_factory=list)


@dataclass
class ExecutionStep:
    """
    Single hop in the vulnerability path tracer.

    SKILL BREAKDOWN: Sequential Execution Flow
    --------------------------------------------
    Recording step name, URL, status, and latency per hop builds the state
    machine required to detect when a session token unlocks unintended resources.
    """

    step_index: int
    name: str
    url: str
    method: str
    status_code: int
    body_preview: str
    elapsed_ms: float
    headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class FuzzCase:
    payload: Any
    strategy: MutationStrategy
    seed: str
    description: str
    target_path: Optional[str] = None
    target_url: Optional[str] = None
    method: str = "POST"


@dataclass
class FuzzResult:
    case: FuzzCase
    success: bool
    status_code: Optional[int]
    anomaly_score: float
    notes: str
    response_preview: str = ""
    jaccard_component: float = 0.0
    latency_component: float = 0.0
    header_component: float = 0.0
    elapsed_ms: float = 0.0
    vulnerability: Optional[VulnerabilityPathNode] = None


@dataclass
class _HeapVariant:
    priority: float
    sequence: int
    case: FuzzCase

    def __lt__(self, other: "_HeapVariant") -> bool:
        return self.priority < other.priority


_ERROR_PATTERNS = re.compile(
    r"(traceback|exception|stack trace|sql syntax|undefined index|fatal error|"
    r"at line \d+|\.py\"|\.java:|NullPointer|TypeError)",
    re.IGNORECASE,
)

_PRIVILEGE_KEYS = frozenset(
    {"role", "is_admin", "admin", "permissions", "access_level", "is_superuser"}
)

_IDOR_KEYS = frozenset({"id", "user_id", "account_id", "owner_id", "resource_id"})


class VulnerabilityPathTracer:
    """
    Maps API execution flows and detects logic flaw paths.

    SKILL BREAKDOWN: API Logic Flaw Path Detection
    ----------------------------------------------
    BOLA/IDOR: cross-object reference returns foreign data without authZ check.
    Mass Assignment: server binds privileged fields from client JSON.
    Error Propagation: verbose faults leak stack paths exploitable for chaining.
    """

    def __init__(self) -> None:
        self._execution_steps: List[ExecutionStep] = []
        self._path_nodes: List[VulnerabilityPathNode] = []
        self._propagation_graph: Dict[str, List[str]] = {}
        self._node_counter = 0
        self._session_token: Optional[str] = None
        self._authenticated_user_id: Optional[int] = None

    def reset(self) -> None:
        self._execution_steps.clear()
        self._path_nodes.clear()
        self._propagation_graph.clear()
        self._node_counter = 0
        self._session_token = None
        self._authenticated_user_id = None

    def record_step(
        self,
        name: str,
        url: str,
        method: str,
        status_code: int,
        body: str,
        elapsed_ms: float,
        headers: Optional[Dict[str, str]] = None,
    ) -> ExecutionStep:
        step = ExecutionStep(
            step_index=len(self._execution_steps) + 1,
            name=name,
            url=url,
            method=method,
            status_code=status_code,
            body_preview=body[:400],
            elapsed_ms=elapsed_ms,
            headers=dict(headers or {}),
        )
        self._execution_steps.append(step)
        self._extract_session_state(body)
        return step

    def _extract_session_state(self, body: str) -> None:
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return
        if isinstance(data, dict):
            if "token" in data:
                self._session_token = str(data["token"])
            if "user_id" in data:
                self._authenticated_user_id = int(data["user_id"])
            user = data.get("user")
            if isinstance(user, dict) and "id" in user:
                self._authenticated_user_id = int(user["id"])

    def _next_node_id(self) -> str:
        self._node_counter += 1
        return f"vuln-{self._node_counter}"

    def analyze_fuzz_result(
        self,
        case: FuzzCase,
        status_code: int,
        body: str,
        url: str,
        elapsed_ms: float,
        baseline_body: str = "",
        baseline_latency_ms: float = 0.0,
        parent_node_id: Optional[str] = None,
    ) -> Optional[VulnerabilityPathNode]:
        """
        Classify a response into vulnerability graph nodes with propagation links.

        SKILL BREAKDOWN: Dependency Routing Tracker
        ---------------------------------------------
        ``propagated_from`` links child anomalies to parent steps so the GUI can
        render how an error or IDOR at step 2 amplifies impact at step 3.
        """
        vuln_type: Optional[VulnerabilityType] = None
        severity = 0.0
        evidence = ""
        remediation = ""

        if case.strategy == MutationStrategy.IDOR_PROBE:
            vuln_type, severity, evidence, remediation = self._detect_idor(
                case, status_code, body, baseline_body
            )
        elif case.strategy == MutationStrategy.MASS_ASSIGN:
            vuln_type, severity, evidence, remediation = self._detect_mass_assignment(
                case, status_code, body
            )
        elif case.strategy in (MutationStrategy.FORMAT_PROBE, MutationStrategy.SEMANTIC_NOISE):
            if _ERROR_PATTERNS.search(body) or (status_code >= 500 and len(body) > 80):
                vuln_type = VulnerabilityType.ERROR_PROPAGATION
                severity = 7.5 if status_code >= 500 else 5.5
                evidence = body[:120]
                remediation = "Sanitize error responses; use generic fault envelopes in production."
        elif _ERROR_PATTERNS.search(body) or (status_code >= 500 and len(body) > 80):
            vuln_type = VulnerabilityType.ERROR_PROPAGATION
            severity = 7.5 if status_code >= 500 else 5.5
            evidence = body[:120]
            remediation = "Sanitize error responses; use generic fault envelopes in production."

        if baseline_latency_ms > 0 and elapsed_ms > baseline_latency_ms * 2.5:
            jitter_node = VulnerabilityPathNode(
                node_id=self._next_node_id(),
                path_url=url,
                vulnerability_type=VulnerabilityType.SUSPICIOUS_JITTER.value,
                severity_score=4.0,
                remediation_vector="Apply rate limits; investigate timing side-channels.",
                step_index=len(self._execution_steps),
                propagated_from=parent_node_id,
                evidence=f"latency {elapsed_ms:.0f}ms vs baseline {baseline_latency_ms:.0f}ms",
            )
            self._path_nodes.append(jitter_node)
            self._link_propagation(parent_node_id, jitter_node.node_id)

        if vuln_type is None:
            return None

        node = VulnerabilityPathNode(
            node_id=self._next_node_id(),
            path_url=url,
            vulnerability_type=vuln_type.value,
            severity_score=severity,
            remediation_vector=remediation,
            step_index=len(self._execution_steps),
            propagated_from=parent_node_id,
            evidence=evidence,
        )
        self._path_nodes.append(node)
        self._link_propagation(parent_node_id, node.node_id)
        return node

    def _detect_idor(
        self,
        case: FuzzCase,
        status_code: int,
        body: str,
        baseline_body: str,
    ) -> Tuple[Optional[VulnerabilityType], float, str, str]:
        """
        Detect Broken Object Level Authorization / IDOR paths.

        SKILL BREAKDOWN: BOLA/IDOR Detection
        --------------------------------------
        If mutating object IDs returns 200 with foreign user content differing
        from baseline, the authorization boundary failed — classic BOLA.
        """
        if status_code not in (200, 201):
            return None, 0.0, "", ""

        try:
            observed = json.loads(body)
            baseline = json.loads(baseline_body) if baseline_body else {}
        except json.JSONDecodeError:
            observed = {}
            baseline = {}

        payload = case.payload if isinstance(case.payload, dict) else {}
        probed_id = payload.get("id") or payload.get("user_id")
        if probed_id is None and case.target_url:
            match = re.search(r"/(?:user|users|account|resource)s?/(\d+)", case.target_url, re.I)
            if match:
                probed_id = int(match.group(1))
        owner_id = observed.get("id") or observed.get("user_id")
        baseline_id = baseline.get("id") or baseline.get("user_id")

        foreign_access = (
            probed_id is not None
            and owner_id is not None
            and self._authenticated_user_id is not None
            and str(owner_id) != str(self._authenticated_user_id)
            and status_code == 200
        )
        cross_object_probe = (
            probed_id is not None
            and owner_id is not None
            and str(probed_id) != str(owner_id)
            and status_code == 200
        )
        body_differs = body != baseline_body and bool(baseline_body)

        if foreign_access or cross_object_probe or (body_differs and probed_id is not None):
            return (
                VulnerabilityType.BOLA_IDOR,
                8.5,
                f"Probed id={probed_id} returned owner id={owner_id}",
                "Enforce object-level authZ: bind resources to session subject server-side.",
            )
        return None, 0.0, "", ""

    def _detect_mass_assignment(
        self,
        case: FuzzCase,
        status_code: int,
        body: str,
    ) -> Tuple[Optional[VulnerabilityType], float, str, str]:
        """
        Detect mass assignment of privileged attributes.

        SKILL BREAKDOWN: Mass Assignment Detection
        --------------------------------------------
        When client-supplied privileged keys (role, is_admin) appear reflected
        with elevated values in responses, the ORM/model binding is too permissive.
        """
        if status_code not in (200, 201):
            return None, 0.0, "", ""

        payload = case.payload if isinstance(case.payload, dict) else {}
        injected = {k: v for k, v in payload.items() if k in _PRIVILEGE_KEYS}
        if not injected:
            return None, 0.0, "", ""

        try:
            observed = json.loads(body)
        except json.JSONDecodeError:
            return None, 0.0, "", ""

        for key, value in injected.items():
            reflected = observed.get(key)
            if reflected == value or (key == "role" and reflected == value):
                return (
                    VulnerabilityType.MASS_ASSIGNMENT,
                    9.0,
                    f"Field '{key}' set to '{value}' reflected in response",
                    "Use DTO allow-lists; never bind request JSON directly to persistence models.",
                )
            user = observed.get("user")
            if isinstance(user, dict) and user.get(key) == value:
                return (
                    VulnerabilityType.MASS_ASSIGNMENT,
                    9.0,
                    f"Nested user.{key}={value} accepted from client payload",
                    "Whitelist updatable fields per role; reject unknown attributes.",
                )
        return None, 0.0, "", ""

    def _link_propagation(self, parent_id: Optional[str], child_id: str) -> None:
        if parent_id:
            self._propagation_graph.setdefault(parent_id, []).append(child_id)

    def build_flow_matrix(self) -> VulnerabilityFlowState:
        """
        Render Visual Flow Matrix from execution steps and detected flaws.

        SKILL BREAKDOWN: Vulnerability Visual Flow Matrix
        ---------------------------------------------------
        Maps sequential hops to SAFE / SUSPICIOUS / CRITICAL bands so operators
        read paths like: [SAFE PATH] Auth ➔ [SUSPICIOUS JITTER] Token ➔ [CRITICAL] IDOR.
        """
        matrix_steps: List[FlowMatrixStep] = []
        max_severity = max((n.severity_score for n in self._path_nodes), default=0.0)

        if not self._execution_steps:
            matrix_steps.append(
                FlowMatrixStep("Awaiting scan", FlowStepStatus.SAFE, step_number=0)
            )
        else:
            for step in self._execution_steps:
                step_vulns = [n for n in self._path_nodes if n.step_index == step.step_index]
                if any(n.vulnerability_type == VulnerabilityType.BOLA_IDOR.value for n in step_vulns):
                    status = FlowStepStatus.CRITICAL
                    label = f"CRITICAL: PATH LEAK @ {step.name}"
                elif any(
                    n.vulnerability_type in (
                        VulnerabilityType.MASS_ASSIGNMENT.value,
                        VulnerabilityType.ERROR_PROPAGATION.value,
                    )
                    for n in step_vulns
                ):
                    status = FlowStepStatus.CRITICAL
                    label = f"CRITICAL: {step.name}"
                elif any(
                    n.vulnerability_type == VulnerabilityType.SUSPICIOUS_JITTER.value
                    for n in step_vulns
                ):
                    status = FlowStepStatus.SUSPICIOUS
                    label = f"SUSPICIOUS JITTER @ {step.name}"
                elif step_vulns:
                    status = FlowStepStatus.SUSPICIOUS
                    label = step.name
                else:
                    status = FlowStepStatus.SAFE
                    label = step.name
                matrix_steps.append(
                    FlowMatrixStep(label=label, status=status, step_number=step.step_index)
                )

        parts = []
        for index, step in enumerate(matrix_steps):
            parts.append(step.display())
            if index < len(matrix_steps) - 1:
                parts.append("➔")
        matrix_line = " ".join(parts)

        trace_lines = [
            "=== Vulnerability Trace Detail ===",
            matrix_line,
            "",
        ]
        for node in self._path_nodes:
            trace_lines.append(
                f"[{node.severity_score:.1f}/10] {node.vulnerability_type} @ {node.path_url}"
            )
            trace_lines.append(f"  Evidence: {node.evidence}")
            trace_lines.append(f"  Remediation: {node.remediation_vector}")
            if node.propagated_from:
                trace_lines.append(f"  Propagated from: {node.propagated_from}")
            trace_lines.append("")

        if not self._path_nodes:
            trace_lines.append("No critical vulnerability paths detected in this scan.")

        return VulnerabilityFlowState(
            matrix_steps=matrix_steps,
            path_nodes=list(self._path_nodes),
            trace_detail="\n".join(trace_lines),
            matrix_line=matrix_line,
        )

    @property
    def execution_steps(self) -> List[ExecutionStep]:
        return list(self._execution_steps)

    @property
    def path_nodes(self) -> List[VulnerabilityPathNode]:
        return list(self._path_nodes)

    @property
    def session_token(self) -> Optional[str]:
        return self._session_token


class FuzzerEngine:
    """Intelligent semantic fuzzer with vulnerability path tracing."""

    BOUNDARY_INTS = [-1, 0, 1, 127, 128, 255, 256, 32767, 32768, 2**31 - 1, 2**31]
    FORMAT_PROBES = ["%s%s%s%n", "{{7*7}}", "${7*7}", "<!--", "\x00admin"]

    def __init__(self, enabled: bool = False) -> None:
        self._enabled = enabled
        self._cases_run = 0
        self._history: List[FuzzResult] = []
        self._dependency_graph: Dict[str, DependencyNode] = {}
        self._heap_counter = 0
        self._baseline_latency_ms: float = 0.0
        self._baseline_headers: Dict[str, str] = {}
        self._baseline_body: str = ""
        self._path_tracer = VulnerabilityPathTracer()
        self._last_flow_state = VulnerabilityFlowState()

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    @property
    def dependency_graph(self) -> Dict[str, DependencyNode]:
        return dict(self._dependency_graph)

    @property
    def path_tracer(self) -> VulnerabilityPathTracer:
        return self._path_tracer

    @property
    def last_flow_state(self) -> VulnerabilityFlowState:
        return self._last_flow_state

    def parse_response_structure(self, body: str, *, root_label: str = "response") -> Dict[str, DependencyNode]:
        self._dependency_graph.clear()
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            self._dependency_graph[root_label] = DependencyNode(
                path=root_label, value_type="opaque", depth=0
            )
            return self._dependency_graph
        self._walk_json(parsed, root_label, None, 0)
        return dict(self._dependency_graph)

    def _walk_json(self, obj: Any, path: str, parent: Optional[str], depth: int) -> None:
        node = DependencyNode(path=path, value_type=type(obj).__name__, depth=depth, parent=parent)
        self._dependency_graph[path] = node
        if parent and parent in self._dependency_graph:
            self._dependency_graph[parent].children.append(path)
        if isinstance(obj, dict):
            for key, value in obj.items():
                self._walk_json(value, f"{path}.{key}", path, depth + 1)
        elif isinstance(obj, list):
            for index, value in enumerate(obj[:20]):
                self._walk_json(value, f"{path}[{index}]", path, depth + 1)

    def export_topology_lines(self) -> List[str]:
        if not self._dependency_graph:
            return ["(no API structure mapped yet)"]
        lines: List[str] = []
        roots = [n for n in self._dependency_graph.values() if n.parent is None]
        for root in sorted(roots, key=lambda n: n.path):
            self._render_node(root, lines, prefix="")
        vuln_lines = ["--- Vulnerability Paths ---"]
        for node in self._path_tracer.path_nodes:
            vuln_lines.append(
                f"[!] {node.vulnerability_type} ({node.severity_score:.1f}) {node.path_url}"
            )
        if len(vuln_lines) > 1:
            lines.extend(vuln_lines)
        return lines

    def _render_node(self, node: DependencyNode, lines: List[str], prefix: str) -> None:
        connector = "└─ " if not node.children else "├─ "
        lines.append(f"{prefix}{connector}{node.path} ({node.value_type})")
        child_prefix = prefix + ("   " if not node.children else "│  ")
        for child_path in node.children:
            child = self._dependency_graph.get(child_path)
            if child:
                self._render_node(child, lines, child_prefix)

    def build_vulnerability_cases(self, base_url: str) -> List[FuzzCase]:
        """
        Generate targeted IDOR and mass-assignment probes for path tracing.

        SKILL BREAKDOWN: Targeted Logic Flaw Probes
        ---------------------------------------------
        Dedicated cases complement random mutation by exercising known OWASP API
        Top 10 failure modes along the Auth → Session → Resource chain.
        """
        base = base_url.rstrip("/")
        cases = [
            FuzzCase(
                payload={"username": "alice", "password": "alice123"},
                strategy=MutationStrategy.BOUNDARY,
                seed=secrets.token_hex(4),
                description="Step 1: Authentication",
                target_url=f"{base}/auth",
                method="POST",
            ),
            FuzzCase(
                payload={"id": 2, "user_id": 2},
                strategy=MutationStrategy.IDOR_PROBE,
                seed=secrets.token_hex(4),
                description="Step 3: IDOR foreign user_id=2",
                target_url=f"{base}/api/user/2",
                method="GET",
            ),
            FuzzCase(
                payload={"name": "bob", "role": "admin", "is_admin": True},
                strategy=MutationStrategy.MASS_ASSIGN,
                seed=secrets.token_hex(4),
                description="Step 3: Mass assignment role escalation",
                target_url=f"{base}/api/profile",
                method="POST",
            ),
            FuzzCase(
                payload={"id": 99999},
                strategy=MutationStrategy.IDOR_PROBE,
                seed=secrets.token_hex(4),
                description="Step 3: IDOR non-existent object",
                target_url=f"{base}/api/user/99999",
                method="GET",
            ),
            FuzzCase(
                payload={"__crash": "%n%n%n"},
                strategy=MutationStrategy.FORMAT_PROBE,
                seed=secrets.token_hex(4),
                description="Error propagation probe",
                target_url=f"{base}/api/debug",
                method="POST",
            ),
        ]
        return cases

    def mutate_json_payload(self, base: Dict[str, Any], rounds: int = 5) -> List[FuzzCase]:
        cases: List[FuzzCase] = []
        strategies = list(MutationStrategy)
        for _ in range(rounds):
            strategy = random.choice(strategies)
            seed = secrets.token_hex(4)
            payload = json.loads(json.dumps(base))
            target_path: Optional[str] = None
            if strategy == MutationStrategy.DEPENDENCY_WALK and self._dependency_graph:
                target_node = random.choice(list(self._dependency_graph.values()))
                target_path = target_node.path
                self._mutate_at_path(payload, target_path)
                desc = f"Dependency walk mutation at '{target_path}'"
            elif strategy == MutationStrategy.BOUNDARY:
                key = random.choice(list(payload.keys())) if payload else "id"
                payload[key] = random.choice(self.BOUNDARY_INTS)
                desc = f"Boundary integer injected into '{key}'"
            elif strategy == MutationStrategy.TYPE_JITTER:
                key = random.choice(list(payload.keys())) if payload else "id"
                payload[key] = random.choice([True, None, [], {}, str(payload.get(key, ""))])
                desc = f"Type jitter on '{key}'"
            elif strategy == MutationStrategy.LENGTH_SPIKE:
                payload["__fuzz_pad"] = "A" * random.choice([256, 1024, 4096])
                desc = "Length spike padding field added"
            elif strategy == MutationStrategy.SEMANTIC_NOISE:
                noise_key = f"_{secrets.token_hex(3)}"
                payload[noise_key] = "".join(random.choices(string.ascii_letters + string.digits, k=32))
                desc = f"Semantic noise key '{noise_key}'"
            elif strategy == MutationStrategy.IDOR_PROBE:
                payload["user_id"] = random.choice([2, 3, 999, -1])
                desc = "IDOR user_id probe"
            elif strategy == MutationStrategy.MASS_ASSIGN:
                payload["role"] = "admin"
                payload["is_admin"] = True
                desc = "Mass assignment probe"
            else:
                payload["__probe"] = random.choice(self.FORMAT_PROBES)
                desc = "Format injection probe inserted"
            cases.append(
                FuzzCase(payload=payload, strategy=strategy, seed=seed, description=desc, target_path=target_path)
            )
        return self._shuffle_variants_heap(cases)

    def _mutate_at_path(self, payload: Dict[str, Any], path: str) -> None:
        leaf = path.split(".")[-1].split("[")[0]
        if leaf in payload:
            payload[leaf] = secrets.token_hex(8)

    def _shuffle_variants_heap(self, cases: List[FuzzCase]) -> List[FuzzCase]:
        heap: List[_HeapVariant] = []
        for case in cases:
            weight = 3.0 if case.strategy == MutationStrategy.LENGTH_SPIKE else 1.0
            if case.strategy in (MutationStrategy.IDOR_PROBE, MutationStrategy.MASS_ASSIGN):
                weight = 0.3
            self._heap_counter += 1
            heapq.heappush(heap, _HeapVariant(weight + random.random(), self._heap_counter, case))
        shuffled = [heapq.heappop(heap).case for _ in range(len(heap))]
        random.shuffle(shuffled)
        return shuffled

    def score_anomaly_multidimensional(
        self,
        baseline_status: int,
        baseline_body: str,
        baseline_headers: Dict[str, str],
        baseline_latency_ms: float,
        observed_status: int,
        observed_body: str,
        observed_headers: Dict[str, str],
        observed_latency_ms: float,
    ) -> Tuple[float, float, float, float]:
        jaccard = self._jaccard_distance(baseline_body, observed_body)
        status_penalty = 0.35 if observed_status != baseline_status else 0.0
        jaccard_component = jaccard * 0.30 + status_penalty
        if baseline_latency_ms <= 0:
            baseline_latency_ms = 1.0
        latency_ratio = abs(observed_latency_ms - baseline_latency_ms) / baseline_latency_ms
        latency_component = min(1.0, latency_ratio) * 0.25
        header_component = self._header_diff_score(baseline_headers, observed_headers) * 0.25
        total = min(1.0, jaccard_component + latency_component + header_component)
        return total, jaccard_component, latency_component, header_component

    def _jaccard_distance(self, a: str, b: str) -> float:
        tokens_a = set(a.lower().split())
        tokens_b = set(b.lower().split())
        union = tokens_a | tokens_b
        if not union:
            return 0.0
        return 1.0 - len(tokens_a & tokens_b) / len(union)

    def _header_diff_score(self, baseline: Dict[str, str], observed: Dict[str, str]) -> float:
        keys_b = {k.lower() for k in baseline}
        keys_o = {k.lower() for k in observed}
        union = keys_b | keys_o
        if not union:
            return 0.0
        symmetric_diff = len(keys_b ^ keys_o)
        value_mismatches = sum(1 for k in keys_b & keys_o if baseline.get(k) != observed.get(k))
        return min(1.0, (symmetric_diff + value_mismatches * 0.5) / max(len(union), 1))

    async def run_vulnerability_flow_scan(
        self,
        base_url: str,
        sender: Callable[[str, str, Any], Any],
    ) -> VulnerabilityFlowState:
        """
        Execute Auth → Session → Resource path with targeted flaw detection.

        SKILL BREAKDOWN: Stateful Vulnerability Path Tracer
        -----------------------------------------------------
        Orchestrates sequential API hops, feeding each response into the tracer
        so BOLA and mass-assignment nodes attach to the correct step index.
        """
        if not self._enabled:
            return VulnerabilityFlowState()

        self._path_tracer.reset()
        cases = self.build_vulnerability_cases(base_url)
        parent_vuln_id: Optional[str] = None
        baseline_body = ""
        baseline_latency = 0.0
        auth_baseline_body = ""

        for case in cases:
            url = case.target_url or base_url
            method = case.method
            try:
                raw = await sender(method, url, case.payload)
                status = int(raw.get("status_code", 0))
                body = str(raw.get("body", ""))
                headers = dict(raw.get("headers", {}))
                elapsed_ms = float(raw.get("elapsed_ms", 0.0))
            except Exception as exc:  # noqa: BLE001
                self._path_tracer.record_step(
                    case.description, url, method, 0, str(exc), 0.0
                )
                continue

            step_name = case.description.split(":")[-1].strip() if ":" in case.description else case.description
            self._path_tracer.record_step(step_name, url, method, status, body, elapsed_ms, headers)

            is_auth_step = "auth" in step_name.lower() or url.rstrip("/").endswith("/auth")
            if is_auth_step and status in (200, 201):
                auth_baseline_body = body
                baseline_body = body
                baseline_latency = elapsed_ms
                self.parse_response_structure(body)
            elif not baseline_body and status in (200, 201) and case.strategy != MutationStrategy.IDOR_PROBE:
                baseline_body = body
                baseline_latency = elapsed_ms
                self.parse_response_structure(body)

            compare_baseline = auth_baseline_body or baseline_body

            vuln = self._path_tracer.analyze_fuzz_result(
                case,
                status,
                body,
                url,
                elapsed_ms,
                baseline_body=compare_baseline,
                baseline_latency_ms=baseline_latency,
                parent_node_id=parent_vuln_id,
            )
            if vuln is not None:
                parent_vuln_id = vuln.node_id

            self._cases_run += 1

        self._last_flow_state = self._path_tracer.build_flow_matrix()
        return self._last_flow_state

    async def run_cases(
        self,
        cases: List[FuzzCase],
        sender: Callable[[Any], Any],
    ) -> List[FuzzResult]:
        if not self._enabled:
            return []

        results: List[FuzzResult] = []
        baseline: Optional[FuzzResult] = None
        parent_vuln_id: Optional[str] = None

        for case in cases:
            try:
                raw = await sender(case.payload)
                status = int(raw.get("status_code", 0))
                body = str(raw.get("body", ""))
                headers = dict(raw.get("headers", {}))
                elapsed_ms = float(raw.get("elapsed_ms", 0.0))
            except Exception as exc:  # noqa: BLE001
                results.append(
                    FuzzResult(
                        case=case,
                        success=False,
                        status_code=None,
                        anomaly_score=1.0,
                        notes=f"Exception: {exc}",
                    )
                )
                continue

            if baseline is None:
                self.parse_response_structure(body)
                self._baseline_latency_ms = elapsed_ms
                self._baseline_headers = headers
                self._baseline_body = body
                anomaly = 0.0
                baseline = FuzzResult(
                    case=case,
                    success=True,
                    status_code=status,
                    anomaly_score=0.0,
                    notes="baseline",
                    response_preview=body[:200],
                    elapsed_ms=elapsed_ms,
                )
                jaccard_c = latency_c = header_c = 0.0
            else:
                anomaly, jaccard_c, latency_c, header_c = self.score_anomaly_multidimensional(
                    baseline.status_code or 0,
                    baseline.response_preview,
                    self._baseline_headers,
                    self._baseline_latency_ms,
                    status,
                    body,
                    headers,
                    elapsed_ms,
                )

            vuln = self._path_tracer.analyze_fuzz_result(
                case,
                status,
                body,
                case.target_url or "",
                elapsed_ms,
                baseline_body=self._baseline_body,
                baseline_latency_ms=self._baseline_latency_ms,
                parent_node_id=parent_vuln_id,
            )
            if vuln is not None:
                parent_vuln_id = vuln.node_id

            result = FuzzResult(
                case=case,
                success=True,
                status_code=status,
                anomaly_score=anomaly,
                notes=case.description,
                response_preview=body[:200],
                jaccard_component=jaccard_c,
                latency_component=latency_c,
                header_component=header_c,
                elapsed_ms=elapsed_ms,
                vulnerability=vuln,
            )
            results.append(result)
            self._cases_run += 1

        self._history.extend(results)
        self._last_flow_state = self._path_tracer.build_flow_matrix()
        return results

    @property
    def cases_run(self) -> int:
        return self._cases_run

    def clear_dependency_graph(self) -> None:
        self._dependency_graph.clear()
        self._path_tracer.reset()
        self._last_flow_state = VulnerabilityFlowState()

    def recent_results(self, limit: int = 20) -> List[FuzzResult]:
        return self._history[-limit:]
