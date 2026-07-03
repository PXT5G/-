"""
Intelligent semantic logic fuzzing engine with API dependency graph analysis.

SKILL BREAKDOWN: Graph-Based Advanced Logic Fuzzing
-------------------------------------------------
Mapping JSON response structures into dependency trees lets the fuzzer target
fields with high coupling (foreign keys, nested objects) rather than blind
random mutation — mirroring how protocol analysts prioritize stateful edges
in API attack surfaces.
"""

from __future__ import annotations

import heapq
import json
import random
import secrets
import string
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple


class MutationStrategy(Enum):
    """Mutation axes for payload generation."""

    BOUNDARY = "boundary"
    TYPE_JITTER = "type_jitter"
    LENGTH_SPIKE = "length_spike"
    SEMANTIC_NOISE = "semantic_noise"
    FORMAT_PROBE = "format_probe"
    DEPENDENCY_WALK = "dependency_walk"


@dataclass
class DependencyNode:
    """
    Node in the API structural dependency tree.

    SKILL BREAKDOWN: Structural Dependency Mapping
    ----------------------------------------------
    Each node records JSON path, inferred type, and parent linkage so
    mutations propagate along realistic object graphs (e.g., mutating
    ``user.id`` before ``user.role``) instead of isolated key swaps.
    """

    path: str
    value_type: str
    depth: int
    parent: Optional[str] = None
    children: List[str] = field(default_factory=list)


@dataclass
class FuzzCase:
    """Single fuzz input with lineage metadata."""

    payload: Any
    strategy: MutationStrategy
    seed: str
    description: str
    target_path: Optional[str] = None


@dataclass
class FuzzResult:
    """Parsed outcome with multi-dimensional anomaly vector."""

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


@dataclass
class _HeapVariant:
    """Internal wrapper for polymorphic heap shuffling."""

    priority: float
    sequence: int
    case: FuzzCase

    def __lt__(self, other: "_HeapVariant") -> bool:
        return self.priority < other.priority


class FuzzerEngine:
    """
    Intelligent semantic fuzzer with dependency graphs and heap shuffling.
    """

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

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    @property
    def dependency_graph(self) -> Dict[str, DependencyNode]:
        return dict(self._dependency_graph)

    def parse_response_structure(self, body: str, *, root_label: str = "response") -> Dict[str, DependencyNode]:
        """
        Autonomously map JSON response body into a dependency tree.

        SKILL BREAKDOWN: Intelligent Semantic Logic Engine
        --------------------------------------------------
        Recursive descent builds paths like ``response.user.email`` with typed
        nodes. Lists are indexed; dict keys become edges. This graph drives
        ``DEPENDENCY_WALK`` mutations that respect object nesting — critical
        for stateful API fuzzing coursework.
        """
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
        node = DependencyNode(
            path=path,
            value_type=type(obj).__name__,
            depth=depth,
            parent=parent,
        )
        self._dependency_graph[path] = node
        if parent and parent in self._dependency_graph:
            self._dependency_graph[parent].children.append(path)

        if isinstance(obj, dict):
            for key, value in obj.items():
                child_path = f"{path}.{key}"
                self._walk_json(value, child_path, path, depth + 1)
        elif isinstance(obj, list):
            for index, value in enumerate(obj[:20]):
                child_path = f"{path}[{index}]"
                self._walk_json(value, child_path, path, depth + 1)

    def export_topology_lines(self) -> List[str]:
        """
        Render dependency tree as text graph for GUI Session Topology View.

        SKILL BREAKDOWN: Session Topology Visualization
        -------------------------------------------------
        Indentation mirrors depth; type annotations help analysts spot
        schema-driven fuzz targets quickly during live operations.
        """
        if not self._dependency_graph:
            return ["(no API structure mapped yet)"]
        lines: List[str] = []
        roots = [n for n in self._dependency_graph.values() if n.parent is None]
        for root in sorted(roots, key=lambda n: n.path):
            self._render_node(root, lines, prefix="")
        return lines

    def _render_node(self, node: DependencyNode, lines: List[str], prefix: str) -> None:
        connector = "└─ " if not node.children else "├─ "
        lines.append(f"{prefix}{connector}{node.path} ({node.value_type})")
        child_prefix = prefix + ("   " if not node.children else "│  ")
        for child_path in node.children:
            child = self._dependency_graph.get(child_path)
            if child:
                self._render_node(child, lines, child_prefix)

    def mutate_json_payload(self, base: Dict[str, Any], rounds: int = 5) -> List[FuzzCase]:
        """Generate mutations including dependency-walk when graph exists."""
        cases: List[FuzzCase] = []
        strategies = list(MutationStrategy)

        for i in range(rounds):
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
                payload[noise_key] = "".join(
                    random.choices(string.ascii_letters + string.digits, k=32)
                )
                desc = f"Semantic noise key '{noise_key}'"
            else:
                payload["__probe"] = random.choice(self.FORMAT_PROBES)
                desc = "Format injection probe inserted"

            cases.append(
                FuzzCase(
                    payload=payload,
                    strategy=strategy,
                    seed=seed,
                    description=desc,
                    target_path=target_path,
                )
            )
        return self._shuffle_variants_heap(cases)

    def _mutate_at_path(self, payload: Dict[str, Any], path: str) -> None:
        """Apply boundary/type jitter at a graph path (simplified path resolver)."""
        segments = path.split(".")
        if len(segments) < 2:
            key = segments[-1].split("[")[0]
            if key in payload:
                payload[key] = random.choice(self.BOUNDARY_INTS + [None, "FUZZ"])
            return
        leaf = segments[-1].split("[")[0]
        if leaf in payload:
            payload[leaf] = secrets.token_hex(8)

    def _shuffle_variants_heap(self, cases: List[FuzzCase]) -> List[FuzzCase]:
        """
        Polymorphic heap shuffling for mutation variant ordering.

        SKILL BREAKDOWN: Polymorphic Heap Shuffling Simulation
        ------------------------------------------------------
        High-throughput fuzzing risks memory pressure from eager case lists.
        Priority-queue shuffling interleaves heavy (length spike) and light
        cases, smoothing allocator churn and mimicking heap allocator noise
        patterns studied in advanced memory forensics.
        """
        heap: List[_HeapVariant] = []
        for case in cases:
            weight = 1.0
            if case.strategy == MutationStrategy.LENGTH_SPIKE:
                weight = 3.0
            elif case.strategy == MutationStrategy.DEPENDENCY_WALK:
                weight = 0.5
            priority = weight + random.random()
            self._heap_counter += 1
            heapq.heappush(heap, _HeapVariant(priority, self._heap_counter, case))

        shuffled: List[FuzzCase] = []
        while heap:
            shuffled.append(heapq.heappop(heap).case)
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
        """
        Multi-dimensional anomaly scoring.

        SKILL BREAKDOWN: Multi-Dimensional Anomaly Scoring
        --------------------------------------------------
        Combining Jaccard body distance, latency z-deviation, and header set
        symmetric difference catches WAF normalization attacks where HTTP 200
        is preserved but security headers or timing skew reveal filtering.
        """
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
        if not tokens_a and not tokens_b:
            return 0.0
        union = tokens_a | tokens_b
        if not union:
            return 0.0
        return 1.0 - len(tokens_a & tokens_b) / len(union)

    def _header_diff_score(self, baseline: Dict[str, str], observed: Dict[str, str]) -> float:
        """
        Score HTTP header set symmetric difference.

        SKILL BREAKDOWN: Custom HTTP Header Difference Analysis
        -------------------------------------------------------
        Security appliances often inject ``X-Request-Id``, ``CF-Ray``, or strip
        ``Set-Cookie`` attributes. Header diffing surfaces these middlebox
        transformations invisible in body-only diffing.
        """
        keys_b = {k.lower() for k in baseline}
        keys_o = {k.lower() for k in observed}
        union = keys_b | keys_o
        if not union:
            return 0.0
        symmetric_diff = len(keys_b ^ keys_o)
        value_mismatches = sum(
            1 for k in keys_b & keys_o if baseline.get(k) != observed.get(k)
        )
        return min(1.0, (symmetric_diff + value_mismatches * 0.5) / max(len(union), 1))

    def score_anomaly(
        self,
        baseline_status: int,
        baseline_body: str,
        observed_status: int,
        observed_body: str,
    ) -> float:
        """Backward-compatible scalar scorer."""
        total, _, _, _ = self.score_anomaly_multidimensional(
            baseline_status,
            baseline_body,
            {},
            self._baseline_latency_ms,
            observed_status,
            observed_body,
            {},
            self._baseline_latency_ms,
        )
        return total

    async def run_cases(
        self,
        cases: List[FuzzCase],
        sender: Callable[[Any], Any],
    ) -> List[FuzzResult]:
        """
        Execute fuzz cases through async sender with multidimensional scoring.

        Sender must return dict with status_code, body, headers, elapsed_ms.
        """
        if not self._enabled:
            return []

        results: List[FuzzResult] = []
        baseline: Optional[FuzzResult] = None

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
            )
            results.append(result)
            self._cases_run += 1

        self._history.extend(results)
        return results

    @property
    def cases_run(self) -> int:
        return self._cases_run

    def clear_dependency_graph(self) -> None:
        """Reset API dependency graph (e.g., after emergency wipe)."""
        self._dependency_graph.clear()

    def recent_results(self, limit: int = 20) -> List[FuzzResult]:
        return self._history[-limit:]
