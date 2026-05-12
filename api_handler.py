"""
HTTP helpers for cross-system integrations.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Union

import requests

logger = logging.getLogger(__name__)


class GenericWebhook:
    """
    Sends configurable POST requests with JSON bodies and returns the parsed response.
    Used for Cross-System Research Integration (external APIs, orchestrators, human-in-the-loop).
    """

    def __init__(self, timeout: float = 120.0, session: Optional[requests.Session] = None) -> None:
        self.timeout = float(timeout)
        self._session = session or requests.Session()

    def post_json(
        self,
        url: str,
        payload: Union[Dict[str, Any], list],
        *,
        headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        POST JSON to ``url`` and return a dict representation of the response.

        - JSON responses are parsed to dict/list then normalized to dict (lists wrapped).
        - Non-JSON bodies are returned as ``{"_raw_text": "..."}``.
        """
        merged_headers = {"Content-Type": "application/json", **(headers or {})}
        logger.info("GenericWebhook POST %s", url)
        response = self._session.post(
            url,
            json=payload,
            headers=merged_headers,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return self._parse_response_body(response)

    def _parse_response_body(self, response: requests.Response) -> Dict[str, Any]:
        text = (response.text or "").strip()
        if not text:
            return {}
        try:
            parsed: Any = response.json()
        except (ValueError, json.JSONDecodeError):
            return {"_raw_text": text}
        if isinstance(parsed, dict):
            return parsed
        if isinstance(parsed, list):
            return {"_list": parsed}
        return {"_value": parsed}
