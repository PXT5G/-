"""
Persona and stealth middleware — UA rotation, cognitive headers, jitter.

SKILL BREAKDOWN: Persona Jittering / Network Stealth
----------------------------------------------------
Automated clients often expose themselves through static headers, perfectly
periodic timing, and missing browser-specific entropy. This middleware
injects variability across identity (User-Agent), cognitive load signals
(headers real browsers emit inconsistently), and inter-request delays drawn
from distributions rather than fixed sleeps — raising the cost of behavioral
fingerprinting during authorized research.
"""

from __future__ import annotations

import asyncio
import random
import secrets
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# Curated persona pool (educational — rotate across realistic browser profiles)
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
        "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 "
        "Firefox/125.0"
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
}


@dataclass
class StealthProfile:
    """Active persona configuration for a session."""

    user_agent: str
    headers: Dict[str, str] = field(default_factory=dict)
    jitter_ms: tuple[int, int] = (50, 400)
    persona_id: str = field(default_factory=lambda: secrets.token_hex(4))


class StealthMiddleware:
    """
    Middleware that builds ephemeral HTTP personas and timing decoys.

    SKILL BREAKDOWN: Algorithmic Decoy Generation
    ---------------------------------------------
    Decoys are not random noise alone — they follow bounded distributions
    (uniform jitter, header subset sampling) so traffic remains plausible.
    Extreme randomization can itself become a detectable signature.
    """

    def __init__(self, enabled: bool = True) -> None:
        self._enabled = enabled
        self._profile: Optional[StealthProfile] = None
        self._request_count = 0

    @property
    def enabled(self) -> bool:
        return self._enabled

    @enabled.setter
    def enabled(self, value: bool) -> None:
        self._enabled = value

    def rotate_persona(self) -> StealthProfile:
        """
        Select a new User-Agent and cognitive header bundle.

        SKILL BREAKDOWN: Persona Rotation
        ---------------------------------
        Rotating identity per session (not per request) mimics a user
        switching devices; per-request rotation mimics shared NAT — choose
        strategy based on threat model. This method supports session-level
        rotation called before a batch of requests.
        """
        ua = random.choice(_USER_AGENTS)
        headers: Dict[str, str] = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        for name, values in _COGNITIVE_HEADER_POOL.items():
            if random.random() > 0.25:
                headers[name] = random.choice(values)

        # Decoy custom header — low probability to avoid over-fingerprinting
        if random.random() < 0.15:
            headers[f"X-Client-Trace-{secrets.token_hex(2)}"] = secrets.token_hex(8)

        self._profile = StealthProfile(
            user_agent=ua,
            headers=headers,
            jitter_ms=(random.randint(30, 120), random.randint(200, 650)),
        )
        return self._profile

    def get_headers(self) -> Dict[str, str]:
        """Return headers for the active persona (rotate if none)."""
        if not self._enabled:
            return {"User-Agent": "TitanRE-EduLab/1.0 (Research)"}
        if self._profile is None:
            self.rotate_persona()
        assert self._profile is not None
        return dict(self._profile.headers)

    async def apply_request_jitter(self) -> float:
        """
        Async sleep with randomized delay — keeps event loop non-blocking.

        SKILL BREAKDOWN: Timing Jitter / Anti-Automation Detection
        ----------------------------------------------------------
        Fixed-interval requests create spectral peaks in timing analysis.
        Uniform jitter between bounds smears those peaks. Gaussian jitter is
        available via ``apply_gaussian_jitter`` for human-like clustering
        around a mean typing delay.
        """
        if not self._enabled or self._profile is None:
            return 0.0
        low, high = self._profile.jitter_ms
        delay_ms = random.randint(low, high)
        await asyncio.sleep(delay_ms / 1000.0)
        self._request_count += 1
        return delay_ms / 1000.0

    async def apply_gaussian_jitter(self, mean_ms: float = 180.0, stdev_ms: float = 45.0) -> float:
        """Human-like delay sampled from a truncated Gaussian."""
        if not self._enabled:
            return 0.0
        sample = max(10.0, random.gauss(mean_ms, stdev_ms))
        await asyncio.sleep(sample / 1000.0)
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
        # Lightweight decoy computation (not security-critical)
        _ = sum(i * i for i in range(random.randint(100, 500)))
        elapsed = time.perf_counter() - start
        return {
            "decoy_compute_s": elapsed,
            "entropy_bits": secrets.randbits(16) / 65535.0,
            "persona_id": self._profile.persona_id if self._profile else "none",
        }

    @property
    def request_count(self) -> int:
        return self._request_count

    @property
    def active_profile(self) -> Optional[StealthProfile]:
        return self._profile
