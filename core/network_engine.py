"""
Asynchronous network engine with padding, TLS mimicry hooks, and multiplexing.

SKILL BREAKDOWN: Network Stealth / TLS Fingerprint Mimicry
-----------------------------------------------------------
TLS fingerprinting (JA3/JA4) inspects ClientHello cipher suites, extensions,
and curve order. Pure ``ssl`` module in CPython exposes limited control; this
engine documents mimicry *intent* via ``TLSProfile`` metadata and optional
cipher reordering while performing real async I/O through aiohttp. Students
learn where Python ends and specialized clients (curl-impersonate, utls) begin.
"""

from __future__ import annotations

import asyncio
import hashlib
import math
import secrets
import ssl
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import aiohttp

from core.stealth_middleware import StealthMiddleware


@dataclass
class TLSProfile:
    """
    Describes a target TLS ClientHello persona for mimicry.

    SKILL BREAKDOWN: TLS Fingerprint Spoofing
    -----------------------------------------
    Fingerprinters hash ordered tuples of TLS parameters. Reordering ciphers
    and enabling specific TLS versions shifts the hash toward a chosen
    profile. Full mimicry requires low-level socket hooks; here we configure
    Python's SSLContext as far as the stdlib permits for lab environments.
    """

    name: str
    min_version: ssl.TLSVersion = ssl.TLSVersion.TLSv1_2
    max_version: ssl.TLSVersion = ssl.TLSVersion.TLSv1_3
    cipher_suites: Optional[List[str]] = None


# Educational profiles — cipher names for logging / partial context setup
_CHROME_PROFILE = TLSProfile(
    name="chrome_124",
    cipher_suites=[
        "TLS_AES_128_GCM_SHA256",
        "TLS_AES_256_GCM_SHA384",
        "TLS_CHACHA20_POLY1305_SHA256",
    ],
)
_FIREFOX_PROFILE = TLSProfile(
    name="firefox_125",
    cipher_suites=[
        "TLS_AES_128_GCM_SHA256",
        "TLS_CHACHA20_POLY1305_SHA256",
        "TLS_AES_256_GCM_SHA384",
    ],
)


@dataclass
class NetworkResponse:
    """Normalized HTTP response for analyzer pipelines."""

    url: str
    status: int
    headers: Dict[str, str]
    body_preview: str
    elapsed_ms: float
    padded: bool
    tls_profile: str
    entropy: float


class NetworkEngine:
    """
    Async HTTP client with connection multiplexing and traffic shaping.

    SKILL BREAKDOWN: Asynchronous Multiplexing
    --------------------------------------------
    aiohttp reuses TCP connections via a connector pool, allowing concurrent
    requests without thread-per-socket overhead. Limiting ``limit_per_host``
    avoids accidental self-DoS while teaching backpressure concepts.
    """

    def __init__(
        self,
        stealth: StealthMiddleware,
        max_connections: int = 20,
        default_tls_profile: TLSProfile = _CHROME_PROFILE,
    ) -> None:
        self._stealth = stealth
        self._max_connections = max_connections
        self._tls_profile = default_tls_profile
        self._session: Optional[aiohttp.ClientSession] = None
        self._semaphore = asyncio.Semaphore(max_connections)
        self._padding_enabled = True

    @property
    def padding_enabled(self) -> bool:
        return self._padding_enabled

    @padding_enabled.setter
    def padding_enabled(self, value: bool) -> None:
        self._padding_enabled = value

    def _build_ssl_context(self, profile: TLSProfile) -> ssl.SSLContext:
        """
        Build SSLContext aligned with the selected TLS persona.

        SKILL BREAKDOWN: Advanced Cryptography / TLS Version Pinning
        --------------------------------------------------------------
        Pinning minimum TLS 1.2 blocks legacy downgrade attacks in lab
        targets. Cipher list assignment is best-effort in stdlib; document
        gaps rather than implying perfect JA3 clone.
        """
        ctx = ssl.create_default_context()
        ctx.minimum_version = profile.min_version
        ctx.maximum_version = profile.max_version
        if profile.cipher_suites:
            try:
                ctx.set_ciphers(":".join(profile.cipher_suites))
            except ssl.SSLError:
                pass
        return ctx

    async def start(self) -> None:
        if self._session is not None:
            return
        connector = aiohttp.TCPConnector(
            limit=self._max_connections,
            limit_per_host=10,
            ssl=self._build_ssl_context(self._tls_profile),
            enable_cleanup_closed=True,
        )
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self._session = aiohttp.ClientSession(connector=connector, timeout=timeout)

    async def stop(self) -> None:
        if self._session is not None:
            await self._session.close()
            self._session = None

    def set_tls_profile(self, profile_name: str) -> str:
        """Switch TLS mimicry profile by name."""
        mapping = {
            "chrome_124": _CHROME_PROFILE,
            "firefox_125": _FIREFOX_PROFILE,
        }
        self._tls_profile = mapping.get(profile_name, _CHROME_PROFILE)
        return self._tls_profile.name

    def _apply_traffic_padding(self, payload: Optional[bytes]) -> Tuple[bytes, bool]:
        """
        Pad request bodies to bucketed sizes to frustrate length-based classifiers.

        SKILL BREAKDOWN: Traffic Padding
        ----------------------------------
        Fixed-size buckets (256, 512, 1024…) reduce information leakage via
        ciphertext or packet length inference — a primitive form of
        traffic-analysis resistance used in privacy protocols.
        """
        if not self._padding_enabled:
            return payload or b"", False
        data = payload or b""
        buckets = (256, 512, 1024, 2048)
        target = next((b for b in buckets if b >= len(data)), len(data) + secrets.randbelow(128))
        if target <= len(data):
            return data, False
        pad_len = target - len(data)
        padded = data + b"\x00" + secrets.token_bytes(pad_len - 1)
        return padded, True

    def _response_entropy(self, body: bytes) -> float:
        """Shannon entropy estimate of response body (educational metric)."""
        if not body:
            return 0.0
        freq: Dict[int, int] = {}
        for byte in body[:4096]:
            freq[byte] = freq.get(byte, 0) + 1
        length = sum(freq.values())

        entropy = 0.0
        for count in freq.values():
            p = count / length
            entropy -= p * math.log2(p)
        return min(entropy, 8.0)

    async def request(
        self,
        method: str,
        url: str,
        data: Optional[bytes] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> NetworkResponse:
        """
        Execute a single stealth-wrapped HTTP request.

        SKILL BREAKDOWN: Protocol Logic Analysis
        ----------------------------------------
        Normalizing status, headers, timing, and entropy equips downstream
        analyzers to diff anomalous responses without re-parsing raw sockets.
        """
        await self.start()
        assert self._session is not None

        async with self._semaphore:
            await self._stealth.apply_request_jitter()
            headers = self._stealth.get_headers()
            if extra_headers:
                headers.update(extra_headers)

            padded_body, was_padded = self._apply_traffic_padding(data)
            start = time.perf_counter()

            async with self._session.request(method, url, headers=headers, data=padded_body) as resp:
                raw = await resp.read()
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                preview = raw[:512].decode("utf-8", errors="replace")
                return NetworkResponse(
                    url=url,
                    status=resp.status,
                    headers={k: v for k, v in resp.headers.items()},
                    body_preview=preview,
                    elapsed_ms=elapsed_ms,
                    padded=was_padded,
                    tls_profile=self._tls_profile.name,
                    entropy=self._response_entropy(raw),
                )

    async def multiplex(
        self,
        jobs: List[Tuple[str, str]],
    ) -> List[NetworkResponse]:
        """
        Fan-out multiple requests concurrently with bounded semaphore.

        SKILL BREAKDOWN: Async Multiplexing
        -----------------------------------
        ``asyncio.gather`` schedules coroutines cooperatively; combined with
        a semaphore, we cap in-flight work to preserve fairness and socket
        hygiene on research targets.
        """
        tasks = [self.request(method, url) for method, url in jobs]
        return await asyncio.gather(*tasks, return_exceptions=False)

    async def fingerprint_probe(self, url: str) -> Dict[str, Any]:
        """
        Emit a diagnostic struct describing active TLS persona and headers.

        SKILL BREAKDOWN: TLS Fingerprint Spoofing (Diagnostics)
        -------------------------------------------------------
        Hashing the ordered cipher string produces a teaching aid analogous
        to JA3 components — not a wire-accurate JA3, but sufficient to
        reason about profile rotation effects in coursework.
        """
        cipher_str = ":".join(self._tls_profile.cipher_suites or [])
        pseudo_ja3 = hashlib.md5(cipher_str.encode(), usedforsecurity=False).hexdigest()
        headers = self._stealth.get_headers()
        return {
            "tls_profile": self._tls_profile.name,
            "pseudo_fingerprint": pseudo_ja3,
            "user_agent": headers.get("User-Agent", ""),
            "header_count": len(headers),
        }
