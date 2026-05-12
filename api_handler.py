"""Service integration helpers for the Automation Control Center.

The module focuses on safe integration-test operations such as saving API
configuration and checking provider account status. It intentionally does not
implement phone-number ordering or CAPTCHA bypass workflows.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


CONFIG_FILE = Path("config.json")


class IntegrationError(RuntimeError):
    """Raised when a provider integration fails."""


class UnsupportedIntegrationOperation(IntegrationError):
    """Raised for integration operations that are intentionally unsupported."""


class ConfigManager:
    """Load and save local API configuration."""

    def __init__(self, config_path: Path = CONFIG_FILE) -> None:
        self.config_path = config_path

    def load(self) -> dict[str, str]:
        """Load API keys from config.json if it exists."""
        if not self.config_path.exists():
            return self.default_config()

        try:
            data = json.loads(self.config_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise IntegrationError("config.json contains invalid JSON.") from exc

        config = self.default_config()
        config.update(
            {
                "five_sim_api_key": str(data.get("five_sim_api_key", "")),
                "capsolver_api_key": str(data.get("capsolver_api_key", "")),
            }
        )
        return config

    def save(
        self,
        five_sim_api_key: str,
        capsolver_api_key: str,
    ) -> None:
        """Persist API keys with owner-only file permissions where supported."""
        payload = {
            "five_sim_api_key": five_sim_api_key.strip(),
            "capsolver_api_key": capsolver_api_key.strip(),
        }
        temp_path = self.config_path.with_suffix(".json.tmp")
        temp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        os.chmod(temp_path, 0o600)
        temp_path.replace(self.config_path)
        os.chmod(self.config_path, 0o600)

    @staticmethod
    def default_config() -> dict[str, str]:
        """Return an empty config shape used by the UI."""
        return {
            "five_sim_api_key": "",
            "capsolver_api_key": "",
        }


class FiveSimClient:
    """Minimal 5sim client for account-status integration tests."""

    BASE_URL = "https://5sim.net/v1"

    def __init__(self, api_key: str, timeout_seconds: int = 20) -> None:
        self.api_key = api_key.strip()
        self.timeout_seconds = timeout_seconds

    def check_balance(self) -> dict[str, Any]:
        """Fetch account profile data and return the current balance."""
        profile = self._request_json("GET", "/user/profile")
        return {
            "balance": profile.get("balance"),
            "currency": profile.get("currency", "RUB"),
            "email": profile.get("email"),
        }

    def order_discord_number(self) -> None:
        """Phone-number ordering is not implemented in this project."""
        raise UnsupportedIntegrationOperation(
            "Ordering virtual numbers is not supported by this integration module."
        )

    def purchase_number(self, service: str = "discord") -> None:
        """Block live virtual-number purchases in this test harness."""
        raise UnsupportedIntegrationOperation(
            f"Live virtual-number purchases for {service!r} are disabled. "
            "Use provider sandboxes or mocked fixtures for production-readiness tests."
        )

    def retrieve_sms_code(self) -> None:
        """SMS retrieval workflows are not implemented in this project."""
        raise UnsupportedIntegrationOperation(
            "Retrieving SMS verification codes is not supported by this integration module."
        )

    def get_sms_code(self, order_id: str) -> None:
        """Block live SMS-code retrieval in this test harness."""
        raise UnsupportedIntegrationOperation(
            f"Live SMS-code retrieval for order {order_id!r} is disabled. "
            "Use mocked verification-code fixtures in staging tests."
        )

    def _request_json(self, method: str, endpoint: str) -> dict[str, Any]:
        """Call a 5sim JSON endpoint."""
        if not self.api_key:
            raise IntegrationError("5sim API key is missing.")

        request = Request(
            f"{self.BASE_URL}{endpoint}",
            method=method,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Accept": "application/json",
            },
        )
        return _send_json_request(request, self.timeout_seconds)


class CapSolverClient:
    """Minimal CapSolver client for account-status integration tests."""

    BASE_URL = "https://api.capsolver.com"

    def __init__(self, api_key: str, timeout_seconds: int = 20) -> None:
        self.api_key = api_key.strip()
        self.timeout_seconds = timeout_seconds

    def check_balance(self) -> dict[str, Any]:
        """Fetch the CapSolver account balance."""
        if not self.api_key:
            raise IntegrationError("CapSolver API key is missing.")

        payload = {"clientKey": self.api_key}
        request = Request(
            f"{self.BASE_URL}/getBalance",
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload).encode("utf-8"),
        )
        response = _send_json_request(request, self.timeout_seconds)
        if response.get("errorId"):
            raise IntegrationError(response.get("errorDescription", "CapSolver API error."))
        return {"balance": response.get("balance"), "package_id": response.get("packageId")}

    def solve_challenge(self) -> None:
        """CAPTCHA and Turnstile solving is not implemented in this project."""
        raise UnsupportedIntegrationOperation(
            "CAPTCHA/Turnstile solving is not supported by this integration module."
        )

    def solve_captcha(self, website_url: str, website_key: str) -> None:
        """Block live CAPTCHA solving in this test harness."""
        raise UnsupportedIntegrationOperation(
            "Live CAPTCHA solving is disabled. "
            f"Use a provider test fixture for {website_url!r} / {website_key!r}."
        )


def _send_json_request(request: Request, timeout_seconds: int) -> dict[str, Any]:
    """Send an HTTP request and decode a JSON response."""
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise IntegrationError(f"HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise IntegrationError(f"Network error: {exc.reason}") from exc

    try:
        decoded = json.loads(body)
    except json.JSONDecodeError as exc:
        raise IntegrationError("Provider returned invalid JSON.") from exc

    if not isinstance(decoded, dict):
        raise IntegrationError("Provider returned an unexpected response shape.")
    return decoded
