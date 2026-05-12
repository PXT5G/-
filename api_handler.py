"""
HTTP helpers for cross-system integrations (webhooks).
"""

from __future__ import annotations

import json
import logging
from typing import Any, Mapping, MutableMapping, Optional, Union

import requests

logger = logging.getLogger(__name__)


class GenericWebhook:
    """
    Sends arbitrary JSON POST payloads to a configurable endpoint.
    Used for Universal / Cross-System Research Integration.
    """

    def __init__(self, url: str, timeout: float = 120.0, session: Optional[requests.Session] = None):
        self.url = (url or "").strip()
        self.timeout = float(timeout)
        self._session = session or requests.Session()

    def send(self, payload: Mapping[str, Any]) -> requests.Response:
        if not self.url:
            raise ValueError("Webhook URL is empty")
        logger.debug("POST %s keys=%s", self.url, list(payload.keys()) if isinstance(payload, Mapping) else type(payload))
        return self._session.post(self.url, json=dict(payload), timeout=self.timeout)

    def send_json_text(self, payload_json: str) -> requests.Response:
        """
        Parse JSON from a string template (after placeholders were resolved) and POST it.
        """
        data = json.loads(payload_json)
        if not isinstance(data, MutableMapping):
            raise TypeError("Webhook JSON template must resolve to a JSON object (dict)")
        return self.send(data)

    @staticmethod
    def parse_response_json(response: requests.Response) -> Optional[Union[dict, list]]:
        try:
            return response.json()
        except (ValueError, json.JSONDecodeError):
            logger.warning("Webhook response is not JSON (status=%s)", response.status_code)
            return None


def extract_code_or_token(payload: Any) -> Optional[str]:
    """
    Recursively look for a string value under 'code' or 'token' keys in a JSON structure.
    Returns the first non-empty string found (prefers 'code' over 'token' at each level).
    """
    if isinstance(payload, dict):
        for key in ("code", "token"):
            val = payload.get(key)
            if val is not None and str(val).strip() != "":
                return str(val).strip()
        for child in payload.values():
            found = extract_code_or_token(child)
            if found:
                return found
    elif isinstance(payload, list):
        for item in payload:
            found = extract_code_or_token(item)
            if found:
                return found
    return None
