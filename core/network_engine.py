"""
Asynchronous network engine — polymorphic stealth, padding, TLS mimicry, multiplexing.

SKILL BREAKDOWN: Network Stealth / Protocol Analysis
----------------------------------------------------
The network layer composes transport personas (TLS), application headers
(HTTP/2/3 simulation), and traffic shaping (padding, chaff) into a single
async pipeline so protocol analysts can observe how each knob shifts
observable entropy and response timing signatures.
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
from urllib.parse import urlparse

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
    jitter_delay_s: float = 0.0
    protocol_snapshot: Dict[str, object] = field(default_factory=dict)


class NetworkEngine:
    """
    Async HTTP client with polymorphic stealth and connection multiplexing.
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
        self._discovered_endpoints: List[str] = []

    @property
    def padding_enabled(self) -> bool:
        return self._padding_enabled

    @padding_enabled.setter
    def padding_enabled(self, value: bool) -> None:
        self._padding_enabled = value

    @property
    def discovered_endpoints(self) -> List[str]:
        return list(self._discovered_endpoints)

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

    def _record_endpoint(self, url: str) -> None:
        """
        Track discovered endpoints for session topology view.

        SKILL BREAKDOWN: Session Topology Mapping
        -----------------------------------------
        Canonicalizing URLs (scheme/host/path) builds a graph of observed
        API surfaces during probes — foundation for dependency-aware fuzzing.
        """
        parsed = urlparse(url)
        canonical = f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"
        if canonical not in self._discovered_endpoints:
            self._discovered_endpoints.append(canonical)

    async def request(
        self,
        method: str,
        url: str,
        data: Optional[bytes] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> NetworkResponse:
        """
        Execute a stealth-orchestrated HTTP request with polymorphic headers.

        SKILL BREAKDOWN: Protocol Logic Analysis
        ----------------------------------------
        Capturing jitter delay, protocol snapshot, and response entropy in
        one struct enables multi-dimensional anomaly scoring downstream.
        """
        await self.start()
        assert self._session is not None

        async with self._semaphore:
            jitter_delay, _ = await self._stealth.orchestrate_request_jitter()
            headers = self._stealth.get_headers()
            if extra_headers:
                headers.update(extra_headers)

            padded_body, was_padded = self._apply_traffic_padding(data)
            start = time.perf_counter()

            async with self._session.request(method, url, headers=headers, data=padded_body) as resp:
                raw = await resp.read()
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                preview = raw[:512].decode("utf-8", errors="replace")
                self._record_endpoint(url)
                return NetworkResponse(
                    url=url,
                    status=resp.status,
                    headers={k: v for k, v in resp.headers.items()},
                    body_preview=preview,
                    elapsed_ms=elapsed_ms,
                    padded=was_padded,
                    tls_profile=self._tls_profile.name,
                    entropy=self._response_entropy(raw),
                    jitter_delay_s=jitter_delay,
                    protocol_snapshot=self._stealth.get_protocol_snapshot(),
                )

    async def multiplex(self, jobs: List[Tuple[str, str]]) -> List[NetworkResponse]:
        """
        Fan-out concurrent requests with bounded semaphore.

        SKILL BREAKDOWN: Async Multiplexing
        -----------------------------------
        ``asyncio.gather`` plus semaphore caps preserves socket hygiene and
        teaches backpressure when scanning multiple protocol endpoints.
        """
        tasks = [self.request(method, url) for method, url in jobs]
        return await asyncio.gather(*tasks, return_exceptions=False)

    async def fingerprint_probe(self, url: str) -> Dict[str, Any]:
        """
        Emit diagnostics for TLS persona, pseudo-JA3, and protocol simulation.

        SKILL BREAKDOWN: TLS Fingerprint Spoofing (Diagnostics)
        -------------------------------------------------------
        Hashing cipher strings approximates JA3 pedagogy; coupling with HTTP/2
        pseudo-order and QUIC CID shows multi-layer fingerprint surfaces.
        """
        cipher_str = ":".join(self._tls_profile.cipher_suites or [])
        pseudo_ja3 = hashlib.md5(cipher_str.encode(), usedforsecurity=False).hexdigest()
        headers = self._stealth.get_headers()
        protocol = self._stealth.get_protocol_snapshot()
        return {
            "tls_profile": self._tls_profile.name,
            "pseudo_fingerprint": pseudo_ja3,
            "user_agent": headers.get("User-Agent", ""),
            "header_count": len(headers),
            "protocol_snapshot": protocol,
            "chaff_packets": self._stealth.chaff_packet_count,
        }

    def clear_topology(self) -> None:
        self._discovered_endpoints.clear()
