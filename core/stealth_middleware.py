"""
Persona & stealth middleware — polymorphic protocol mimicry, stochastic jitter, chaff.

SKILL BREAKDOWN: Network Stealth / Polymorphic Protocol Mimicry
---------------------------------------------------------------
Stateful firewalls correlate header ordering, HTTP version signals, and timing
spectra. Polymorphic mimicry rotates these observables per request so static
signatures cannot anchor long-lived blocks during authorized protocol research.
"""

from __future__ import annotations

import asyncio
import math
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
    """Stochastic latency models for traffic shaping."""

    GAUSSIAN = "gaussian"
    PARETO = "pareto"
    UNIFORM = "uniform"


@dataclass
class HTTP2PseudoLayout:
    """
    Simulated HTTP/2 pseudo-header ordering for polymorphic mimicry.

    SKILL BREAKDOWN: HTTP/2 Header Layout Polymorphism
    --------------------------------------------------
    Real browsers emit :method, :authority, :scheme, :path in subtly different
    HPACK contexts. Shuffling pseudo-header *representation order* in our
    outbound dict simulates layout variance visible to L7 parsers even when
    wire encoding uses HTTP/1.1 upgrade paths in lab mode.
    """

    order: Tuple[str, ...] = (":method", ":authority", ":scheme", ":path")
    stream_dependency: int = 0
    weight: int = 16
    exclusive: bool = False


@dataclass
class QUICConnectionState:
    """
    Simulated HTTP/3 (QUIC) connection state structure.

    SKILL BREAKDOWN: QUIC State Simulation
    --------------------------------------
    QUIC exposes connection IDs, version negotiation, and AEAD packet numbers.
    Modeling these fields lets researchers reason about middlebox inference
    without requiring a full QUIC stack in the teaching scaffold.
    """

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
    """Active persona configuration for a session."""

    user_agent: str
    headers: Dict[str, str] = field(default_factory=dict)
    jitter_ms: Tuple[int, int] = (50, 400)
    persona_id: str = field(default_factory=lambda: secrets.token_hex(4))
    http2_layout: HTTP2PseudoLayout = field(default_factory=HTTP2PseudoLayout)
    quic_state: QUICConnectionState = field(default_factory=QUICConnectionState)
    chaff_keys: Dict[str, str] = field(default_factory=dict)


@dataclass
class ChaffBundle:
    """Probabilistic decoy metadata injected into traffic configuration."""

    honey_keys: Dict[str, str]
    decoy_tokens: List[str]
    shuffle_seed: str


class StochasticJitterOrchestrator:
    """
    Models behavioral latency using Gaussian and Pareto distributions.

    SKILL BREAKDOWN: Stochastic Traffic Jittering Orchestration
    -------------------------------------------------------------
    Human interaction exhibits heavy-tailed pauses (Pareto) mixed with
    clustered micro-delays (Gaussian). Blending distributions blinds
    heuristic state-inspection firewalls that threshold on fixed RTT bands.
    """

    def __init__(self) -> None:
        self._samples: List[float] = []
        self._last_sample_ts = time.monotonic()

    def sample_ms(self, distribution: JitterDistribution) -> float:
        if distribution == JitterDistribution.GAUSSIAN:
            value = max(15.0, random.gauss(180.0, 55.0))
        elif distribution == JitterDistribution.PARETO:
            # xm=50ms, alpha=2.5 — heavy tail for "distraction" pauses
            xm = 50.0
            alpha = 2.5
            u = random.random()
            value = xm / (u ** (1.0 / alpha))
            value = min(value, 2500.0)
        else:
            value = float(random.randint(40, 450))
        self._samples.append(value)
        if len(self._samples) > 128:
            self._samples.pop(0)
        self._last_sample_ts = time.monotonic()
        return value

    @property
    def frequency_hz(self) -> float:
        """
        Estimate jitter event frequency from recent sample spacing.

        SKILL BREAKDOWN: Jitter Frequency Telemetry
        -------------------------------------------
        Sudden frequency spikes may indicate bot-like burstiness; smoothing
        for GUI meters uses recent sample count over observation window.
        """
        if len(self._samples) < 2:
            return 0.0
        return min(20.0, len(self._samples) / 10.0)


class StealthMiddleware:
    """
    Polymorphic protocol mimicry, chaff injection, and stochastic jitter.
    """

    def __init__(self, enabled: bool = True) -> None:
        self._enabled = enabled
        self._profile: Optional[StealthProfile] = None
        self._request_count = 0
        self._jitter = StochasticJitterOrchestrator()
        self._chaff_packets = 0
        self._distribution_cycle = [
            JitterDistribution.GAUSSIAN,
            JitterDistribution.PARETO,
            JitterDistribution.UNIFORM,
        ]

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    def rotate_persona(self) -> StealthProfile:
        """
        Build a new persona with polymorphic HTTP/2 layout and QUIC state.

        SKILL BREAKDOWN: Persona Rotation
        ---------------------------------
        Coupling UA rotation with transport-level state (QUIC CID, HTTP/2
        weight) prevents mismatched fingerprints where headers claim Chrome
        but timing resembles scripted curl.
        """
        ua = random.choice(_USER_AGENTS)
        headers: Dict[str, str] = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        for name, values in _COGNITIVE_HEADER_POOL.items():
            if random.random() > 0.2:
                headers[name] = random.choice(values)

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
        """
        Shuffle pseudo-header order and stream scheduler metadata.

        SKILL BREAKDOWN: Polymorphic Protocol Mimicry Logic
        ---------------------------------------------------
        HPACK dynamic table evolution depends on header arrival order.
        Varying pseudo-header sequences exercises server parsers that assume
        browser-static ordering — a common bug class in API gateways.
        """
        base = [":method", ":authority", ":scheme", ":path", ":protocol"]
        random.shuffle(base)
        return HTTP2PseudoLayout(
            order=tuple(base[: random.randint(4, 5)]),
            stream_dependency=random.randint(0, 7),
            weight=random.choice([16, 32, 64, 128]),
            exclusive=random.random() < 0.3,
        )

    def generate_chaff_bundle(self) -> ChaffBundle:
        """
        Inject probabilistic decoy metadata and honey-keys.

        SKILL BREAKDOWN: Chaff Data Generation & Shuffling
        --------------------------------------------------
        Honey-keys appear authentic but map to sink telemetry. Defenders
        triggering them reveal exfiltration attempts; researchers study how
        chaff density affects classifier false-positive rates.
        """
        honey_keys = {}
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

    def get_headers(self) -> Dict[str, str]:
        """Return polymorphic header set including simulated HTTP/2 metadata."""
        if not self._enabled:
            return {"User-Agent": "TitanRE-EduLab/2.0 (Research)"}
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
        """
        Apply stochastic jitter from rotating distribution models.

        SKILL BREAKDOWN: Stochastic Traffic Jittering Orchestration
        -------------------------------------------------------------
        Cycling Gaussian → Pareto → Uniform per request prevents firewall
        ML models from converging on a single latency manifold.
        """
        if not self._enabled or self._profile is None:
            return 0.0, JitterDistribution.UNIFORM

        distribution = self._distribution_cycle[self._request_count % len(self._distribution_cycle)]
        delay_ms = self._jitter.sample_ms(distribution)
        await asyncio.sleep(delay_ms / 1000.0)
        self._request_count += 1
        if self._profile.quic_state:
            self._profile.quic_state.datagrams_sent += 1
        return delay_ms / 1000.0, distribution

    async def apply_request_jitter(self) -> float:
        """Backward-compatible jitter hook."""
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
        """
        Synchronous micro-delays and bogus CPU work metadata for decoy logs.

        SKILL BREAKDOWN: Cognitive Load Simulation
        --------------------------------------------
        Some WAFs correlate TLS termination time with JS execution markers.
        Returning synthetic timing metadata helps students reason about
        multi-layer correlation even when we do not execute a real browser.
        """
        start = time.perf_counter()
        _ = sum(i * i for i in range(random.randint(100, 500)))
        elapsed = time.perf_counter() - start
        return {
            "decoy_compute_s": elapsed,
            "entropy_bits": secrets.randbits(16) / 65535.0,
            "persona_id": self._profile.persona_id if self._profile else "none",
            "jitter_freq_hz": self._jitter.frequency_hz,
        }

    def get_protocol_snapshot(self) -> Dict[str, object]:
        """Export HTTP/2 + QUIC simulation state for diagnostics."""
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
    def active_profile(self) -> Optional[StealthProfile]:
        return self._profile
