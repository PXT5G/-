"""
Dynamic fuzzing and API boundary analyzer engine.

SKILL BREAKDOWN: Protocol Logic Analysis / Fuzzing
--------------------------------------------------
Fuzzing discovers parser differentials by mutating inputs along semantic and
syntactic axes. This engine combines structured mutations (boundary integers,
format string probes) with response classification so students observe how
*identical* HTTP status codes may hide divergent application behavior.
"""

from __future__ import annotations

import json
import random
import secrets
import string
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class MutationStrategy(Enum):
    """Mutation axes for payload generation."""

    BOUNDARY = "boundary"
    TYPE_JITTER = "type_jitter"
    LENGTH_SPIKE = "length_spike"
    SEMANTIC_NOISE = "semantic_noise"
    FORMAT_PROBE = "format_probe"


@dataclass
class FuzzCase:
    """Single fuzz input with lineage metadata."""

    payload: Any
    strategy: MutationStrategy
    seed: str
    description: str


@dataclass
class FuzzResult:
    """Parsed outcome of sending a fuzz case to a target function."""

    case: FuzzCase
    success: bool
    status_code: Optional[int]
    anomaly_score: float
    notes: str
    response_preview: str = ""


class FuzzerEngine:
    """
    Payload mutation engine with anomalous response scoring.

    SKILL BREAKDOWN: Semantic Jittering
    -----------------------------------
    Random bytes alone miss logic bugs; semantic jitter perturbs types,
    encodings, and field ordering while preserving JSON/XML structure enough
    to reach deep parser stages — a hybrid of generational and mutational
    fuzzing suitable for API coursework.
    """

    BOUNDARY_INTS = [-1, 0, 1, 127, 128, 255, 256, 32767, 32768, 2**31 - 1, 2**31]
    FORMAT_PROBES = ["%s%s%s%n", "{{7*7}}", "${7*7}", "<!--", "\x00admin"]

    def __init__(self, enabled: bool = False) -> None:
        self._enabled = enabled
        self._cases_run = 0
        self._history: List[FuzzResult] = []

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    def mutate_json_payload(self, base: Dict[str, Any], rounds: int = 5) -> List[FuzzCase]:
        """
        Generate mutated JSON-compatible payloads from a seed object.

        SKILL BREAKDOWN: API Logic Boundary Testing
        ---------------------------------------------
        Servers often validate top-level types strictly but fail on nested
        coercion (string vs int). Mutating nested fields targets those
        implicit conversion paths without breaking overall document structure.
        """
        cases: List[FuzzCase] = []
        strategies = list(MutationStrategy)

        for _ in range(rounds):
            strategy = random.choice(strategies)
            seed = secrets.token_hex(4)
            payload = json.loads(json.dumps(base))  # deep copy via JSON

            if strategy == MutationStrategy.BOUNDARY:
                key = random.choice(list(payload.keys())) if payload else "id"
                payload[key] = random.choice(self.BOUNDARY_INTS)
                desc = f"Boundary integer injected into '{key}'"

            elif strategy == MutationStrategy.TYPE_JITTER:
                key = random.choice(list(payload.keys())) if payload else "id"
                payload[key] = random.choice([True, None, [], {}, str(payload.get(key, ""))])
                desc = f"Type jitter on '{key}'"

            elif strategy == MutationStrategy.LENGTH_SPIKE:
                payload["__fuzz_pad"] = "A" * random.choice([256, 1024, 4096, 16384])
                desc = "Length spike padding field added"

            elif strategy == MutationStrategy.SEMANTIC_NOISE:
                noise_key = f"_{secrets.token_hex(3)}"
                payload[noise_key] = "".join(
                    random.choices(string.ascii_letters + string.digits, k=32)
                )
                desc = f"Semantic noise key '{noise_key}'"

            else:  # FORMAT_PROBE
                payload["__probe"] = random.choice(self.FORMAT_PROBES)
                desc = "Format injection probe inserted"

            cases.append(
                FuzzCase(payload=payload, strategy=strategy, seed=seed, description=desc)
            )
        return cases

    def score_anomaly(
        self,
        baseline_status: int,
        baseline_body: str,
        observed_status: int,
        observed_body: str,
    ) -> float:
        """
        Compute anomaly score vs baseline response fingerprint.

        SKILL BREAKDOWN: Anomalous Response Parsing
        ---------------------------------------------
        WAFs may normalize status codes to 403 while body length collapses.
        Scoring blends status delta, length ratio, and token overlap so
        students detect soft failures not visible in status alone.
        """
        score = 0.0
        if observed_status != baseline_status:
            score += 0.4
        len_ratio = abs(len(observed_body) - len(baseline_body)) / max(len(baseline_body), 1)
        score += min(len_ratio, 1.0) * 0.35
        baseline_tokens = set(baseline_body.lower().split())
        observed_tokens = set(observed_body.lower().split())
        if baseline_tokens:
            jaccard = 1.0 - len(baseline_tokens & observed_tokens) / len(
                baseline_tokens | observed_tokens
            )
            score += jaccard * 0.25
        return min(score, 1.0)

    async def run_cases(
        self,
        cases: List[FuzzCase],
        sender: Callable[[Any], Any],
    ) -> List[FuzzResult]:
        """
        Execute fuzz cases through an async sender callable.

        The sender should accept payload and return a dict with
        ``status_code`` and ``body`` keys (typically wrapping NetworkEngine).
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
            except Exception as exc:  # noqa: BLE001 — fuzzer captures faults
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
                anomaly = 0.0
                baseline = FuzzResult(
                    case=case,
                    success=True,
                    status_code=status,
                    anomaly_score=0.0,
                    notes="baseline",
                    response_preview=body[:200],
                )
            else:
                anomaly = self.score_anomaly(
                    baseline.status_code or 0,
                    baseline.response_preview,
                    status,
                    body,
                )

            result = FuzzResult(
                case=case,
                success=True,
                status_code=status,
                anomaly_score=anomaly,
                notes=case.description,
                response_preview=body[:200],
            )
            results.append(result)
            self._cases_run += 1

        self._history.extend(results)
        return results

    @property
    def cases_run(self) -> int:
        return self._cases_run

    def recent_results(self, limit: int = 20) -> List[FuzzResult]:
        return self._history[-limit:]
