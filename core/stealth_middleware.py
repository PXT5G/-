"""
Sovereign stealth middleware — tracker poisoning, adaptive jitter, protocol mimicry.

SKILL BREAKDOWN: Advanced Behavioral Anti-Forensics
---------------------------------------------------
Server-side anomaly detectors build behavioral fingerprints from timing,
interaction entropy, and header cadence. Adversarial sample injection poisons
those models with synthetic human-like telemetry so research traffic blends
into benign population statistics during authorized assessments.
"""

from __future__ import annotations

import asyncio
import json
import random
import secrets
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple


_USER_AGENTS: List[str] = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.4 Safari/605.1.15"
    ),
    (
        "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) "
        "Gecko/20100101 Firefox/125.0"
    ),
]

_COGNITIVE_HEADER_POOL: Dict[str, List[str]] = {
    "Accept-Language": ["en-US,en;q=0.9", "en-GB,en;q=0.8", "en-US,en;q=0.7,de;q=0.3"],
    "Sec-CH-UA-Platform": ['"Windows"', '"macOS"', '"Linux"'],
    "DNT": ["1", "0"],
    "Upgrade-Insecure-Requests": ["1"],
    "Cache-Control": ["no-cache", "max-age=0"],
    "Priority": ["u=0, i", "u=1", "u=1, i"],
}


class JitterDistribution(Enum):
    GAUSSIAN = "gaussian"
    PARETO = "pareto"
    UNIFORM = "uniform"


@dataclass
class HTTP2PseudoLayout:
    order: Tuple[str, ...] = (":method", ":authority", ":scheme", ":path")
    stream_dependency: int = 0
    weight: int = 16
    exclusive: bool = False


@dataclass
class QUICConnectionState:
    version: str = "1"
    connection_id: str = field(default_factory=lambda: secrets.token_hex(8))
    initial_rtt_ms: float = 42.0
    max_idle_timeout_ms: int = 30000
    active_cid_sequence: int = 0
    tls_group: str = "X25519"
    aead_cipher: str = "AES_128_GCM"
    datagrams_sent: int = 0


@dataclass
class StealthProfile:
    user_agent: str
    headers: Dict[str, str] = field(default_factory=dict)
    jitter_ms: Tuple[int, int] = (50, 400)
    persona_id: str = field(default_factory=lambda: secrets.token_hex(4))
    http2_layout: HTTP2PseudoLayout = field(default_factory=HTTP2PseudoLayout)
    quic_state: QUICConnectionState = field(default_factory=QUICConnectionState)
    chaff_keys: Dict[str, str] = field(default_factory=dict)


@dataclass
class ChaffBundle:
    honey_keys: Dict[str, str]
    decoy_tokens: List[str]
    shuffle_seed: str


@dataclass
class BehavioralPoisonSample:
    """
    Synthetic interaction packet for tracker poisoning.

    SKILL BREAKDOWN: Adversarial Sample Injection
    -----------------------------------------------
    Realistic mouse paths and typing delays mimic human session telemetry
    injected as header metadata, corrupting server-side bot-classifier training
    distributions when aggregated at scale.
    """

    mouse_events: List[Dict[str, float]]
    typing_delays_ms: List[float]
    scroll_depth: float
    focus_blur_count: int
    session_entropy: float


@dataclass
class TargetResponseProfile:
    """Cached target response characteristics for adaptive jitter."""

    status_code: int = 200
    elapsed_ms: float = 0.0
    body_length: int = 0
    anomaly_hint: float = 0.0


class TrackerPoisoningEngine:
    """
    Generates adversarial behavioral samples to poison heuristic trackers.

    SKILL BREAKDOWN: Tracker Poisoning
    ------------------------------------
    By flooding classifiers with plausible-but-fake interaction vectors,
    researchers measure robustness of server-side anomaly pipelines and
    practice defensive hardening against polluted training data.
    """

    def __init__(self) -> None:
        self._samples_generated = 0

    def generate_poison_sample(self) -> BehavioralPoisonSample:
        mouse_events = []
        x, y = random.uniform(100, 400), random.uniform(100, 400)
        for _ in range(random.randint(5, 15)):
            x += random.gauss(0, 25)
            y += random.gauss(0, 18)
            mouse_events.append(
                {
                    "x": round(max(0, x), 2),
                    "y": round(max(0, y), 2),
                    "dt_ms": max(8.0, random.gauss(32.0, 12.0)),
                }
            )

        typing_delays = [max(40.0, random.gauss(120.0, 35.0)) for _ in range(random.randint(3, 10))]
        self._samples_generated += 1

        return BehavioralPoisonSample(
            mouse_events=mouse_events,
            typing_delays_ms=typing_delays,
            scroll_depth=random.uniform(0.1, 0.95),
            focus_blur_count=random.randint(0, 4),
            session_entropy=secrets.randbits(16) / 65535.0,
        )

    def encode_as_headers(self, sample: BehavioralPoisonSample) -> Dict[str, str]:
        """Serialize poison sample into outbound HTTP header decoys."""
        return {
            "X-Beh-Mouse-Trace": json.dumps(sample.mouse_events[:5])[:256],
            "X-Beh-Typing-Mean": f"{sum(sample.typing_delays_ms) / len(sample.typing_delays_ms):.1f}",
            "X-Beh-Scroll": f"{sample.scroll_depth:.3f}",
            "X-Beh-Focus-Blur": str(sample.focus_blur_count),
            "X-Beh-Entropy": f"{sample.session_entropy:.4f}",
        }

    @property
    def samples_generated(self) -> int:
        return self._samples_generated


class StochasticJitterOrchestrator:
    """
    Adaptive Gaussian/Pareto jitter with target-response switching.

    SKILL BREAKDOWN: Dynamic Noise Model Switching
    ------------------------------------------------
    When targets return errors or high latency, Pareto heavy-tail jitter mimics
    frustrated user backoff; healthy 200 responses trigger Gaussian micro-
    delays resembling fluent reading — blinding stateful firewalls to static bots.
    """

    def __init__(self) -> None:
        self._samples: List[float] = []
        self._active_distribution = JitterDistribution.GAUSSIAN
        self._target_profile = TargetResponseProfile()
        self._last_sample_ts = time.monotonic()

    def update_target_profile(
        self,
        status_code: int,
        elapsed_ms: float,
        body_length: int,
        anomaly_hint: float = 0.0,
    ) -> JitterDistribution:
        """
        Switch noise model based on target response characteristics.

        SKILL BREAKDOWN: Response-Driven Jitter Adaptation
        ----------------------------------------------------
        Stateful inspection systems correlate retry timing with error classes.
        Adapting distributions post-response emulates human frustration or
        confidence — evading fixed-threshold bot scores.
        """
        self._target_profile = TargetResponseProfile(
            status_code=status_code,
            elapsed_ms=elapsed_ms,
            body_length=body_length,
            anomaly_hint=anomaly_hint,
        )
        if status_code >= 500 or status_code in (403, 429) or anomaly_hint > 0.6:
            self._active_distribution = JitterDistribution.PARETO
        elif elapsed_ms > 800.0:
            self._active_distribution = JitterDistribution.PARETO
        else:
            self._active_distribution = JitterDistribution.GAUSSIAN
        return self._active_distribution

    @property
    def active_distribution(self) -> JitterDistribution:
        return self._active_distribution

    def sample_ms(self, distribution: Optional[JitterDistribution] = None) -> float:
        dist = distribution or self._active_distribution
        if dist == JitterDistribution.GAUSSIAN:
            value = max(15.0, random.gauss(180.0, 55.0))
        elif dist == JitterDistribution.PARETO:
            xm = 50.0
            alpha = 2.5
            u = max(random.random(), 1e-6)
            value = min(xm / (u ** (1.0 / alpha)), 2500.0)
        else:
            value = float(random.randint(40, 450))
        self._samples.append(value)
        if len(self._samples) > 128:
            self._samples.pop(0)
        self._last_sample_ts = time.monotonic()
        return value

    @property
    def frequency_hz(self) -> float:
        if len(self._samples) < 2:
            return 0.0
        return min(20.0, len(self._samples) / 10.0)


class StealthMiddleware:
    """Polymorphic mimicry, tracker poisoning, adaptive stochastic jitter."""

    def __init__(self, enabled: bool = True) -> None:
        self._enabled = enabled
        self._profile: Optional[StealthProfile] = None
        self._request_count = 0
        self._jitter = StochasticJitterOrchestrator()
        self._poison = TrackerPoisoningEngine()
        self._chaff_packets = 0
        self._last_poison_sample: Optional[BehavioralPoisonSample] = None

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    def rotate_persona(self) -> StealthProfile:
        ua = random.choice(_USER_AGENTS)
        headers: Dict[str, str] = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        for name, values in _COGNITIVE_HEADER_POOL.items():
            if random.random() > 0.2:
                headers[name] = random.choice(values)

        poison_sample = self._poison.generate_poison_sample()
        self._last_poison_sample = poison_sample
        headers.update(self._poison.encode_as_headers(poison_sample))

        http2_layout = self._polymorphic_http2_layout()
        quic_state = QUICConnectionState(
            connection_id=secrets.token_hex(8),
            initial_rtt_ms=random.uniform(28.0, 120.0),
            active_cid_sequence=random.randint(0, 3),
            tls_group=random.choice(["X25519", "P-256"]),
        )
        chaff = self.generate_chaff_bundle()
        for key, value in chaff.honey_keys.items():
            headers[key] = value

        self._profile = StealthProfile(
            user_agent=ua,
            headers=headers,
            jitter_ms=(random.randint(30, 120), random.randint(200, 650)),
            http2_layout=http2_layout,
            quic_state=quic_state,
            chaff_keys=dict(chaff.honey_keys),
        )
        return self._profile

    def _polymorphic_http2_layout(self) -> HTTP2PseudoLayout:
        base = [":method", ":authority", ":scheme", ":path", ":protocol"]
        random.shuffle(base)
        return HTTP2PseudoLayout(
            order=tuple(base[: random.randint(4, 5)]),
            stream_dependency=random.randint(0, 7),
            weight=random.choice([16, 32, 64, 128]),
            exclusive=random.random() < 0.3,
        )

    def generate_chaff_bundle(self) -> ChaffBundle:
        honey_keys: Dict[str, str] = {}
        if random.random() < 0.6:
            honey_keys[f"X-Api-Key-{secrets.token_hex(2)}"] = secrets.token_hex(16)
        if random.random() < 0.4:
            honey_keys["Authorization"] = f"Bearer decoy_{secrets.token_hex(12)}"
        if random.random() < 0.35:
            honey_keys[f"X-Session-{secrets.token_hex(3)}"] = secrets.token_urlsafe(18)
        decoy_tokens = [secrets.token_hex(8) for _ in range(random.randint(1, 4))]
        random.shuffle(decoy_tokens)
        self._chaff_packets += 1
        return ChaffBundle(
            honey_keys=honey_keys,
            decoy_tokens=decoy_tokens,
            shuffle_seed=secrets.token_hex(6),
        )

    def ingest_target_response(
        self,
        status_code: int,
        elapsed_ms: float,
        body_length: int,
        anomaly_hint: float = 0.0,
    ) -> JitterDistribution:
        """
        Feed target response metrics to adaptive jitter orchestrator.

        SKILL BREAKDOWN: Closed-Loop Stealth Adaptation
        -------------------------------------------------
        Post-request feedback closes the control loop: stealth parameters evolve
        per target behavior instead of remaining static across sessions.
        """
        return self._jitter.update_target_profile(status_code, elapsed_ms, body_length, anomaly_hint)

    def get_headers(self) -> Dict[str, str]:
        if not self._enabled:
            return {"User-Agent": "TitanRE-EduLab/3.0 (Sovereign)"}
        if self._profile is None:
            self.rotate_persona()
        assert self._profile is not None

        headers = dict(self._profile.headers)
        layout = self._profile.http2_layout
        headers["X-HTTP2-Stream-Weight"] = str(layout.weight)
        headers["X-HTTP2-Dependency"] = str(layout.stream_dependency)
        headers["X-HTTP2-Pseudo-Order"] = ",".join(layout.order)
        quic = self._profile.quic_state
        headers["Alt-Svc"] = f'h3=":{443 + random.randint(0, 3)}"; ma=3600'
        headers["X-Sim-QUIC-CID"] = quic.connection_id
        headers["X-Sim-QUIC-Version"] = quic.version
        return headers

    async def orchestrate_request_jitter(self) -> Tuple[float, JitterDistribution]:
        if not self._enabled or self._profile is None:
            return 0.0, JitterDistribution.UNIFORM

        distribution = self._jitter.active_distribution
        delay_ms = self._jitter.sample_ms(distribution)
        await asyncio.sleep(delay_ms / 1000.0)
        self._request_count += 1
        if self._profile.quic_state:
            self._profile.quic_state.datagrams_sent += 1
        return delay_ms / 1000.0, distribution

    async def apply_request_jitter(self) -> float:
        delay, _ = await self.orchestrate_request_jitter()
        return delay

    async def apply_gaussian_jitter(self, mean_ms: float = 180.0, stdev_ms: float = 45.0) -> float:
        if not self._enabled:
            return 0.0
        sample = max(10.0, random.gauss(mean_ms, stdev_ms))
        await asyncio.sleep(sample / 1000.0)
        self._jitter._samples.append(sample)
        return sample / 1000.0

    def execution_delay_decoy(self) -> Dict[str, float]:
        start = time.perf_counter()
        _ = sum(i * i for i in range(random.randint(100, 500)))
        elapsed = time.perf_counter() - start
        return {
            "decoy_compute_s": elapsed,
            "entropy_bits": secrets.randbits(16) / 65535.0,
            "persona_id": self._profile.persona_id if self._profile else "none",
            "jitter_freq_hz": self._jitter.frequency_hz,
            "poison_samples": float(self._poison.samples_generated),
        }

    def get_protocol_snapshot(self) -> Dict[str, object]:
        if self._profile is None:
            return {}
        layout = self._profile.http2_layout
        quic = self._profile.quic_state
        return {
            "http2_pseudo_order": list(layout.order),
            "http2_weight": layout.weight,
            "quic_cid": quic.connection_id,
            "quic_rtt_ms": quic.initial_rtt_ms,
            "quic_datagrams": quic.datagrams_sent,
            "chaff_keys": list(self._profile.chaff_keys.keys()),
            "jitter_model": self._jitter.active_distribution.value,
            "poison_samples": self._poison.samples_generated,
        }

    @property
    def request_count(self) -> int:
        return self._request_count

    @property
    def jitter_frequency_hz(self) -> float:
        return self._jitter.frequency_hz

    @property
    def chaff_packet_count(self) -> int:
        return self._chaff_packets

    @property
    def tracker_poison_samples(self) -> int:
        return self._poison.samples_generated

    @property
    def active_profile(self) -> Optional[StealthProfile]:
        return self._profile
