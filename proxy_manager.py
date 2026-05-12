"""Proxy list loading and rotation for geographic latency testing."""

from __future__ import annotations

import os
import threading
from dataclasses import dataclass
from pathlib import Path


PROXY_FILE = Path("proxies.txt")


class ProxyManagerError(RuntimeError):
    """Raised when proxy configuration cannot be loaded."""


@dataclass(frozen=True)
class ProxyConfig:
    """One proxy entry from proxies.txt."""

    host: str
    port: int
    username: str
    password: str
    scheme: str = "http"

    @property
    def server(self) -> str:
        """Return the Playwright proxy server URL."""
        return f"{self.scheme}://{self.host}:{self.port}"

    @property
    def redacted(self) -> str:
        """Return a safe display value without credentials."""
        return f"{self.scheme}://{self.host}:{self.port}"

    def to_playwright_proxy(self) -> dict[str, str]:
        """Convert this proxy into Playwright's launch proxy shape."""
        return {
            "server": self.server,
            "username": self.username,
            "password": self.password,
        }


class ProxyManager:
    """Load, validate, and rotate proxy entries."""

    def __init__(self, proxy_path: Path = PROXY_FILE) -> None:
        self.proxy_path = proxy_path
        self.proxies: list[ProxyConfig] = []
        self._next_index = 0
        self.last_error: str | None = None
        self._lock = threading.Lock()
        self.reload()

    def reload(self, strict: bool = False) -> int:
        """Reload proxies from disk and return the number of valid entries."""
        with self._lock:
            if not self.proxy_path.exists():
                self.proxies = []
                self._next_index = 0
                self.last_error = None
                return 0

            loaded: list[ProxyConfig] = []
            try:
                for line_number, line in enumerate(
                    self.proxy_path.read_text(encoding="utf-8").splitlines(),
                    start=1,
                ):
                    stripped = line.strip()
                    if not stripped or stripped.startswith("#"):
                        continue
                    loaded.append(self._parse_proxy_line(stripped, line_number))
            except ProxyManagerError as exc:
                self.proxies = []
                self._next_index = 0
                self.last_error = str(exc)
                if strict:
                    raise
                return 0

            self.proxies = loaded
            self._next_index = 0
            self.last_error = None
            return len(self.proxies)

    def get_next_proxy(self) -> ProxyConfig | None:
        """Return the next proxy in round-robin order."""
        with self._lock:
            if not self.proxies:
                return None

            proxy = self.proxies[self._next_index]
            self._next_index = (self._next_index + 1) % len(self.proxies)
            return proxy

    def import_proxy_file(self, source_path: Path) -> int:
        """Import a proxy list file into proxies.txt and reload it."""
        source_text = source_path.read_text(encoding="utf-8")
        self.proxy_path.write_text(source_text, encoding="utf-8")
        os.chmod(self.proxy_path, 0o600)
        return self.reload(strict=True)

    @staticmethod
    def _parse_proxy_line(line: str, line_number: int) -> ProxyConfig:
        """Parse ip:port:user:pass proxy rows."""
        parts = line.split(":")
        if len(parts) != 4:
            raise ProxyManagerError(
                f"Invalid proxy format on line {line_number}; expected ip:port:user:pass."
            )

        host, port_text, username, password = (part.strip() for part in parts)
        if not host or not port_text or not username or not password:
            raise ProxyManagerError(
                f"Invalid proxy value on line {line_number}; all fields are required."
            )

        try:
            port = int(port_text)
        except ValueError as exc:
            raise ProxyManagerError(
                f"Invalid proxy port on line {line_number}: {port_text!r}."
            ) from exc

        if not 1 <= port <= 65535:
            raise ProxyManagerError(
                f"Invalid proxy port on line {line_number}: {port_text!r}."
            )

        return ProxyConfig(host=host, port=port, username=username, password=password)
