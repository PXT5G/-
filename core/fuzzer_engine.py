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
import math
import random
import re
import secrets
import string
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple

from models.task_model import (
    FeedbackReward,
    FlowMatrixStep,
    FlowStepStatus,
    MutationLoopState,
    RewardTier,
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
    SCHEMA_DRIVEN = "schema_driven"


class SchemaFieldType(str, Enum):
    """JSON Schema primitive types used by the constrained generator."""

    STRING = "string"
    INTEGER = "integer"
    NUMBER = "number"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"


@dataclass
class SchemaField:
    """
    Single parameter constraint extracted from OpenAPI / JSON Schema.

    SKILL BREAKDOWN: Schema-Constrained Payload Generation
    ------------------------------------------------------
    Knowing declared types and bounds lets TitanRE emit *valid-shaped* but
    boundary-breaking values — e.g. ``integer`` at ``2**31`` or ``string`` at
    ``maxLength`` — instead of random opaque blobs that servers reject early.
    """

    name: str
    field_type: SchemaFieldType
    required: bool = True
    minimum: Optional[int] = None
    maximum: Optional[int] = None
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    enum: Optional[List[Any]] = None
    example: Optional[Any] = None


@dataclass
class EndpointSchema:
    """Endpoint layout: HTTP method, path, and request body field constraints."""

    path: str
    method: str
    fields: List[SchemaField] = field(default_factory=list)
    description: str = ""


@dataclass
class _RewardHeapItem:
    """Max-heap item: higher reward scores dequeue first for RL-style exploration."""

    neg_reward: float
    sequence: int
    case: "FuzzCase"
    path_hierarchy: str

    def __lt__(self, other: "_RewardHeapItem") -> bool:
        return self.neg_reward < other.neg_reward


class OpenAPISchemaRegistry:
    """
    Parses or simulates OpenAPI-style layout constraints for TitanRE targets.

    SKILL BREAKDOWN: OpenAPI Layout Constraint Parsing
    ----------------------------------------------------
    Even a partial schema (paths + requestBody properties) is enough to steer
    mutations toward semantically meaningful parameters — the same signal
    production API gateways use for validation-before-handler routing.
    """

    def __init__(self) -> None:
        self._endpoints: Dict[str, EndpointSchema] = {}

    def load_spec(self, spec: Dict[str, Any], base_url: str = "") -> None:
        """Ingest an OpenAPI 3.x-like dict and register endpoint schemas."""
        self._endpoints.clear()
        base = base_url.rstrip("/")
        paths = spec.get("paths", {})
        for path, methods in paths.items():
            if not isinstance(methods, dict):
                continue
            for method, detail in methods.items():
                if method.upper() not in ("GET", "POST", "PUT", "PATCH", "DELETE"):
                    continue
                fields = self._extract_fields(detail)
                key = f"{method.upper()} {base}{path}"
                self._endpoints[key] = EndpointSchema(
                    path=f"{base}{path}",
                    method=method.upper(),
                    fields=fields,
                    description=str(detail.get("summary", path)),
                )

    def _extract_fields(self, detail: Dict[str, Any]) -> List[SchemaField]:
        fields: List[SchemaField] = []
        body = detail.get("requestBody", {})
        content = body.get("content", {})
        json_schema = content.get("application/json", {}).get("schema", {})
        if not json_schema and "schema" in detail:
            json_schema = detail["schema"]
        properties = json_schema.get("properties", {})
        required_set = set(json_schema.get("required", []))
        for name, prop in properties.items():
            if not isinstance(prop, dict):
                continue
            raw_type = str(prop.get("type", "string"))
            try:
                field_type = SchemaFieldType(raw_type)
            except ValueError:
                field_type = SchemaFieldType.STRING
            fields.append(
                SchemaField(
                    name=name,
                    field_type=field_type,
                    required=name in required_set,
                    minimum=prop.get("minimum"),
                    maximum=prop.get("maximum"),
                    min_length=prop.get("minLength"),
                    max_length=prop.get("maxLength"),
                    pattern=prop.get("pattern"),
                    enum=prop.get("enum"),
                    example=prop.get("example"),
                )
            )
        return fields

    def register_endpoint(self, endpoint: EndpointSchema) -> None:
        key = f"{endpoint.method} {endpoint.path}"
        self._endpoints[key] = endpoint

    def get_endpoint(self, method: str, path: str) -> Optional[EndpointSchema]:
        return self._endpoints.get(f"{method.upper()} {path}")

    def all_endpoints(self) -> List[EndpointSchema]:
        return list(self._endpoints.values())

    @staticmethod
    def mock_titanre_spec(base_url: str) -> Dict[str, Any]:
        """Built-in lab OpenAPI fragment matching ``mock_target_server`` layout."""
        base = base_url.rstrip("/")
        return {
            "paths": {
                f"{base}/auth": {
                    "post": {
                        "summary": "Authentication",
                        "requestBody": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": ["username", "password"],
                                        "properties": {
                                            "username": {"type": "string", "minLength": 1, "maxLength": 64},
                                            "password": {"type": "string", "minLength": 4, "maxLength": 128},
                                        },
                                    }
                                }
                            }
                        },
                    }
                },
                f"{base}/api/vault/exfil": {
                    "post": {
                        "summary": "Hidden vault exfiltration gate",
                        "requestBody": {
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "required": [
                                            "vault_key",
                                            "sequence_id",
                                            "checksum",
                                            "escalation_vector",
                                        ],
                                        "properties": {
                                            "vault_key": {
                                                "type": "string",
                                                "example": "titanre-quantum-seed",
                                            },
                                            "sequence_id": {
                                                "type": "integer",
                                                "minimum": 1,
                                                "maximum": 100,
                                                "example": 42,
                                            },
                                            "checksum": {
                                                "type": "string",
                                                "pattern": "^[a-f0-9]{6}$",
                                                "example": "1a85f5",
                                            },
                                            "escalation_vector": {
                                                "type": "string",
                                                "example": "schema-mutation-alpha",
                                            },
                                        },
                                    }
                                }
                            }
                        },
                    }
                },
            }
        }


class SchemaConstrainedPayloadGenerator:
    """
    Generates type-correct, boundary-breaking payloads from endpoint schemas.

    SKILL BREAKDOWN: Boundary-Breaking Type-Correct Mutations
    ---------------------------------------------------------
    For each declared field the generator emits: integer limits (``-1``, ``2**31``),
    string injection boundaries (length spikes, format probes), and type-swaps
    (``bool`` where ``int`` expected) — maximizing handler coverage while staying
    inside the API's *expected* parameter envelope.
    """

    BOUNDARY_INTS = [-1, 0, 1, 127, 255, 32767, 2**31 - 1, 2**31]
    INJECTION_STRINGS = ["' OR 1=1--", "{{7*7}}", "%n%n%n", "\x00admin", "A" * 256]

    def __init__(self, registry: OpenAPISchemaRegistry) -> None:
        self._registry = registry

    def baseline_payload(self, endpoint: EndpointSchema) -> Dict[str, Any]:
        payload: Dict[str, Any] = {}
        for field in endpoint.fields:
            payload[field.name] = self._valid_value(field)
        return payload

    def generate_mutations(
        self,
        endpoint: EndpointSchema,
        *,
        rounds_per_field: int = 2,
    ) -> List[FuzzCase]:
        cases: List[FuzzCase] = []
        for field in endpoint.fields:
            for variant in self._field_mutations(field):
                payload = self.baseline_payload(endpoint)
                payload[field.name] = variant
                cases.append(
                    FuzzCase(
                        payload=payload,
                        strategy=MutationStrategy.SCHEMA_DRIVEN,
                        seed=secrets.token_hex(4),
                        description=f"Schema mutation: {field.name}={variant!r}",
                        target_url=endpoint.path,
                        method=endpoint.method,
                        target_path=field.name,
                    )
                )
            for _ in range(rounds_per_field):
                payload = self.baseline_payload(endpoint)
                payload[field.name] = self._boundary_value(field)
                cases.append(
                    FuzzCase(
                        payload=payload,
                        strategy=MutationStrategy.SCHEMA_DRIVEN,
                        seed=secrets.token_hex(4),
                        description=f"Schema boundary: {field.name}",
                        target_url=endpoint.path,
                        method=endpoint.method,
                        target_path=field.name,
                    )
                )
        return cases

    def _valid_value(self, field: SchemaField) -> Any:
        if field.example is not None:
            return field.example
        if field.enum:
            return field.enum[0]
        if field.field_type == SchemaFieldType.INTEGER:
            return field.minimum if field.minimum is not None else 1
        if field.field_type == SchemaFieldType.BOOLEAN:
            return False
        if field.field_type == SchemaFieldType.NUMBER:
            return 1.0
        if field.field_type == SchemaFieldType.ARRAY:
            return []
        if field.field_type == SchemaFieldType.OBJECT:
            return {}
        return "lab"

    def _boundary_value(self, field: SchemaField) -> Any:
        if field.field_type == SchemaFieldType.INTEGER:
            if field.maximum is not None:
                return field.maximum + 1
            return random.choice(self.BOUNDARY_INTS)
        if field.field_type == SchemaFieldType.STRING:
            if field.max_length is not None:
                return "X" * (field.max_length + 16)
            return random.choice(self.INJECTION_STRINGS)
        if field.field_type == SchemaFieldType.BOOLEAN:
            return random.choice([True, False, "true", 1, None])
        if field.field_type in (SchemaFieldType.NUMBER,):
            return random.choice([-1.0, 0.0, 1e308])
        return random.choice(self.INJECTION_STRINGS)

    def _field_mutations(self, field: SchemaField) -> List[Any]:
        mutations: List[Any] = []
        if field.field_type == SchemaFieldType.INTEGER:
            mutations.extend(self.BOUNDARY_INTS[:6])
            if field.example is not None:
                mutations.append(field.example)
        elif field.field_type == SchemaFieldType.STRING:
            mutations.extend(self.INJECTION_STRINGS[:3])
            if field.example is not None:
                mutations.append(field.example)
            if field.pattern:
                mutations.append("1a85f5")
        elif field.field_type == SchemaFieldType.BOOLEAN:
            mutations.extend([True, False, None, "yes"])
        return mutations[:5]


class FeedbackRewardTracker:
    """
    Evaluates HTTP responses against an abstract reward matrix.

    SKILL BREAKDOWN: Feedback-Driven Reward Optimization Loop
    ---------------------------------------------------------
    High-reward signals (500 errors, stack traces, structural key mismatches)
    boost variant priority in the exploration heap. Medium rewards (latency
    spikes, body-length drift) keep the loop probing adjacent path hierarchies —
    simulating how RL-guided fuzzers concentrate effort on promising branches.
    """

    def __init__(self) -> None:
        self._reward_history: List[FeedbackReward] = []
        self._strategy_counts: Dict[str, int] = {}
        self._max_score = 0.0
        self._loop_state = MutationLoopState()

    def reset(self) -> None:
        self._reward_history.clear()
        self._strategy_counts.clear()
        self._max_score = 0.0
        self._loop_state = MutationLoopState()

    def evaluate(
        self,
        status_code: int,
        body: str,
        elapsed_ms: float,
        *,
        baseline_body: str = "",
        baseline_latency_ms: float = 0.0,
        path_hierarchy: str = "",
    ) -> FeedbackReward:
        score = 0.0
        tier = RewardTier.NONE
        reasons: List[str] = []
        body_len_delta = abs(len(body) - len(baseline_body)) if baseline_body else len(body)
        latency_ratio = (
            elapsed_ms / baseline_latency_ms if baseline_latency_ms > 0 else 1.0
        )

        if "leak_class" in body.lower() and "critical" in body.lower():
            score = 1.0
            tier = RewardTier.HIGH
            reasons.append("critical data leak response structure")
        elif status_code >= 500 or _ERROR_PATTERNS.search(body):
            score = max(score, 0.92)
            tier = RewardTier.HIGH
            reasons.append("server fault or stack trace leak")
        elif self._structural_mismatch(baseline_body, body):
            score = max(score, 0.78)
            tier = RewardTier.HIGH
            reasons.append("response schema structural mismatch / authZ drift")
        elif status_code in (401, 403) and baseline_body and body != baseline_body:
            score = max(score, 0.62)
            tier = RewardTier.MEDIUM
            reasons.append("authorization gate response drift")
        elif baseline_latency_ms > 0 and latency_ratio >= 2.5:
            score = max(score, 0.48)
            tier = RewardTier.MEDIUM
            reasons.append("unexpected latency deviation")
        elif baseline_body and body_len_delta > max(40, len(baseline_body) * 0.25):
            score = max(score, 0.42)
            tier = RewardTier.MEDIUM
            reasons.append("response body length anomaly")

        reward = FeedbackReward(
            tier=tier,
            score=score,
            reason="; ".join(reasons) if reasons else "baseline response",
            path_hierarchy=path_hierarchy,
            status_code=status_code,
            body_length_delta=body_len_delta,
            latency_ratio=latency_ratio,
        )
        self._reward_history.append(reward)
        self._max_score = max(self._max_score, score)
        if tier == RewardTier.HIGH:
            self._loop_state.high_reward_hits += 1
        elif tier == RewardTier.MEDIUM:
            self._loop_state.medium_reward_hits += 1
        self._loop_state.payload_reward_multiplier = 1.0 + self._max_score * 9.0
        return reward

    def record_strategy(self, strategy: str) -> None:
        self._strategy_counts[strategy] = self._strategy_counts.get(strategy, 0) + 1
        total = sum(self._strategy_counts.values())
        if total <= 1:
            self._loop_state.mutation_entropy_rate = 0.0
            return
        entropy = 0.0
        for count in self._strategy_counts.values():
            p = count / total
            entropy -= p * math.log2(p)
        max_entropy = math.log2(max(len(self._strategy_counts), 2))
        self._loop_state.mutation_entropy_rate = min(1.0, entropy / max(max_entropy, 1e-9))

    def update_loop_state(
        self,
        *,
        iterations: int,
        path_hierarchy: str = "",
        exploration_depth: int = 0,
    ) -> MutationLoopState:
        self._loop_state.iterations = iterations
        self._loop_state.active_path_hierarchy = path_hierarchy
        self._loop_state.exploration_depth = exploration_depth
        return self._loop_state

    @property
    def loop_state(self) -> MutationLoopState:
        return self._loop_state

    @property
    def max_score(self) -> float:
        return self._max_score

    def _structural_mismatch(self, baseline_body: str, observed_body: str) -> bool:
        if not baseline_body or not observed_body:
            return False
        try:
            baseline = json.loads(baseline_body)
            observed = json.loads(observed_body)
        except json.JSONDecodeError:
            return baseline_body[:80] != observed_body[:80]
        if isinstance(baseline, dict) and isinstance(observed, dict):
            return set(baseline.keys()) != set(observed.keys())
        return type(baseline) is not type(observed)


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
    reward_score: float = 0.0
    path_hierarchy: str = ""


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
    reward: Optional[FeedbackReward] = None


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
        elif case.strategy == MutationStrategy.SCHEMA_DRIVEN and self._detect_critical_leak(body):
            vuln_type = VulnerabilityType.CRITICAL_DATA_LEAK
            severity = 10.0
            evidence = body[:160]
            remediation = (
                "Remove hidden exfiltration gates; enforce multi-factor server-side "
                "validation independent of client-supplied sequence tokens."
            )
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

    def _detect_critical_leak(self, body: str) -> bool:
        """Detect simulated critical exfiltration responses from schema-driven probes."""
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            return "leak_class" in body.lower() and "critical" in body.lower()
        if not isinstance(data, dict):
            return False
        return (
            str(data.get("leak_class", "")).lower() == "critical"
            or bool(data.get("exfiltrated_records"))
        )

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
                        VulnerabilityType.CRITICAL_DATA_LEAK.value,
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
        self._schema_registry = OpenAPISchemaRegistry()
        self._schema_generator = SchemaConstrainedPayloadGenerator(self._schema_registry)
        self._reward_tracker = FeedbackRewardTracker()
        self._exploration_heap: List[_RewardHeapItem] = []

    @property
    def schema_registry(self) -> OpenAPISchemaRegistry:
        return self._schema_registry

    @property
    def reward_tracker(self) -> FeedbackRewardTracker:
        return self._reward_tracker

    @property
    def mutation_entropy_rate(self) -> float:
        return self._reward_tracker.loop_state.mutation_entropy_rate

    @property
    def payload_reward_multiplier(self) -> float:
        return self._reward_tracker.loop_state.payload_reward_multiplier

    def load_target_schema(self, base_url: str, spec: Optional[Dict[str, Any]] = None) -> None:
        """Load OpenAPI layout constraints for schema-driven mutation."""
        openapi = spec or OpenAPISchemaRegistry.mock_titanre_spec(base_url)
        self._schema_registry.load_spec(openapi, base_url="")

    def build_schema_mutation_cases(self, base_url: str) -> List[FuzzCase]:
        """
        Build schema-constrained mutation cases for all registered endpoints.

        SKILL BREAKDOWN: Endpoint-Adaptive Mutation
        -------------------------------------------
        Cases inherit per-field types from the OpenAPI registry so the path
        tracer can correlate anomalies with the exact parameter that broke invariants.
        """
        self.load_target_schema(base_url)
        cases: List[FuzzCase] = []
        for endpoint in self._schema_registry.all_endpoints():
            if endpoint.path.endswith("/auth"):
                continue
            cases.extend(self._schema_generator.generate_mutations(endpoint, rounds_per_field=1))
        return cases

    def prioritize_by_reward(self, cases: List[FuzzCase], rewards: Dict[str, float]) -> List[FuzzCase]:
        """Re-order variants using reward scores — RL exploration tree simulation."""
        heap: List[_RewardHeapItem] = []
        for index, case in enumerate(cases):
            hierarchy = case.path_hierarchy or case.target_path or case.description
            inherited = rewards.get(hierarchy, case.reward_score)
            self._heap_counter += 1
            heapq.heappush(
                heap,
                _RewardHeapItem(-(inherited + random.random() * 0.1), self._heap_counter, case, hierarchy),
            )
        ordered = [heapq.heappop(heap).case for _ in range(len(heap))]
        return ordered

    def mutate_along_path(
        self,
        parent_case: FuzzCase,
        endpoint: EndpointSchema,
        *,
        depth: int,
    ) -> List[FuzzCase]:
        """Generate child mutations along a high-reward compromised path hierarchy."""
        children: List[FuzzCase] = []
        parent_payload = dict(parent_case.payload) if isinstance(parent_case.payload, dict) else {}
        for field in endpoint.fields:
            if field.name not in parent_payload:
                continue
            child_payload = dict(parent_payload)
            child_payload[field.name] = self._schema_generator._boundary_value(field)
            hierarchy = f"{parent_case.path_hierarchy}>{field.name}"
            children.append(
                FuzzCase(
                    payload=child_payload,
                    strategy=MutationStrategy.SCHEMA_DRIVEN,
                    seed=secrets.token_hex(4),
                    description=f"RL child depth={depth}: {field.name}",
                    target_url=endpoint.path,
                    method=endpoint.method,
                    target_path=field.name,
                    reward_score=parent_case.reward_score,
                    path_hierarchy=hierarchy,
                )
            )
        return children

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

    async def run_autonomous_mutation_loop(
        self,
        base_url: str,
        sender: Callable[[str, str, Any], Any],
        *,
        max_iterations: int = 24,
        progress_callback: Optional[Callable[[MutationLoopState], None]] = None,
    ) -> MutationLoopState:
        """
        Feedback-driven schema mutation loop simulating RL exploration.

        SKILL BREAKDOWN: Autonomous Reinforcement Exploration Tree
        ------------------------------------------------------------
        Responses are scored via the reward matrix; high/medium tiers enqueue
        child mutations along the same path hierarchy — concentrating effort on
        branches that exhibit authorization drift or fault leakage.
        """
        if not self._enabled:
            return MutationLoopState()

        self._reward_tracker.reset()
        self.load_target_schema(base_url)
        base = base_url.rstrip("/")

        auth_endpoint = self._schema_registry.get_endpoint("POST", f"{base}/auth")
        if auth_endpoint:
            auth_payload = self._schema_generator.baseline_payload(auth_endpoint)
            auth_payload.update({"username": "alice", "password": "alice123"})
            try:
                raw = await sender("POST", f"{base}/auth", auth_payload)
                self._path_tracer.record_step(
                    "Schema Auth",
                    f"{base}/auth",
                    "POST",
                    int(raw.get("status_code", 0)),
                    str(raw.get("body", "")),
                    float(raw.get("elapsed_ms", 0.0)),
                )
                await sender(
                    "POST",
                    f"{base}/api/vault/prime",
                    {"phase": 1, "nonce": "schema-seq-alpha"},
                )
            except Exception:  # noqa: BLE001
                pass

        vault_endpoint = self._schema_registry.get_endpoint("POST", f"{base}/api/vault/exfil")
        if vault_endpoint is None:
            return self._reward_tracker.update_loop_state(iterations=0)

        seed_cases = self._schema_generator.generate_mutations(vault_endpoint, rounds_per_field=2)
        golden_payload = self._schema_generator.baseline_payload(vault_endpoint)
        seed_cases.insert(
            0,
            FuzzCase(
                payload=golden_payload,
                strategy=MutationStrategy.SCHEMA_DRIVEN,
                seed=secrets.token_hex(4),
                description="Schema golden: all fields at OpenAPI examples",
                target_url=vault_endpoint.path,
                method=vault_endpoint.method,
                path_hierarchy="vault.golden",
                reward_score=0.5,
            ),
        )
        path_rewards: Dict[str, float] = {}
        baseline_body = ""
        baseline_latency = 0.0
        parent_vuln_id: Optional[str] = None
        queue_cases = self.prioritize_by_reward(seed_cases, path_rewards)
        iteration = 0
        exploration_depth = 0
        loop_state = MutationLoopState()

        while queue_cases and iteration < max_iterations:
            case = queue_cases.pop(0)
            iteration += 1
            url = case.target_url or f"{base}/api/vault/exfil"
            try:
                raw = await sender(case.method, url, case.payload)
                status = int(raw.get("status_code", 0))
                body = str(raw.get("body", ""))
                elapsed_ms = float(raw.get("elapsed_ms", 0.0))
            except Exception as exc:  # noqa: BLE001
                self._path_tracer.record_step(
                    case.description, url, case.method, 0, str(exc), 0.0
                )
                continue

            hierarchy = case.path_hierarchy or case.target_path or "vault.root"
            reward = self._reward_tracker.evaluate(
                status,
                body,
                elapsed_ms,
                baseline_body=baseline_body,
                baseline_latency_ms=baseline_latency,
                path_hierarchy=hierarchy,
            )
            self._reward_tracker.record_strategy(case.strategy.value)
            path_rewards[hierarchy] = max(path_rewards.get(hierarchy, 0.0), reward.score)
            case.reward_score = reward.score

            self._path_tracer.record_step(
                f"Schema:{case.description[:40]}",
                url,
                case.method,
                status,
                body,
                elapsed_ms,
            )

            if not baseline_body and status in (200, 201, 401, 403):
                baseline_body = body
                baseline_latency = elapsed_ms

            vuln = self._path_tracer.analyze_fuzz_result(
                case,
                status,
                body,
                url,
                elapsed_ms,
                baseline_body=baseline_body,
                baseline_latency_ms=baseline_latency,
                parent_node_id=parent_vuln_id,
            )
            if vuln is not None:
                parent_vuln_id = vuln.node_id

            if reward.tier in (RewardTier.HIGH, RewardTier.MEDIUM):
                exploration_depth += 1
                children = self.mutate_along_path(case, vault_endpoint, depth=exploration_depth)
                for child in children:
                    child.reward_score = reward.score * 0.85
                queue_cases = self.prioritize_by_reward(children + queue_cases, path_rewards)

            loop_state = self._reward_tracker.update_loop_state(
                iterations=iteration,
                path_hierarchy=hierarchy,
                exploration_depth=exploration_depth,
            )
            if progress_callback is not None:
                progress_callback(loop_state)

            self._cases_run += 1

        return loop_state

    async def run_vulnerability_flow_scan(
        self,
        base_url: str,
        sender: Callable[[str, str, Any], Any],
        progress_callback: Optional[Callable[[MutationLoopState], None]] = None,
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
        mutation_state = await self.run_autonomous_mutation_loop(
            base_url,
            sender,
            max_iterations=20,
            progress_callback=progress_callback,
        )
        self._last_flow_state = self._path_tracer.build_flow_matrix()
        self._last_flow_state.mutation_loop = mutation_state
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
        self._reward_tracker.reset()
        self._last_flow_state = VulnerabilityFlowState()

    def recent_results(self, limit: int = 20) -> List[FuzzResult]:
        return self._history[-limit:]
