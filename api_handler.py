"""
HTTP helpers for cross-system integrations (webhooks, external APIs).
"""

from __future__ import annotations

import json
import logging
from string import Template
from typing import Any, Mapping

import requests

logger = logging.getLogger(__name__)


class GenericWebhook:
    """
    Sends a POST request with a JSON body built from a template and context values.

    The payload template is a JSON string that may include ``$placeholder`` tokens
    compatible with :class:`string.Template` (e.g. ``{"detail": "$detail"}``).
    """

    def __init__(self, url: str, timeout_seconds: float = 30.0) -> None:
        self.url = (url or "").strip()
        self.timeout_seconds = float(timeout_seconds)

    def build_payload(self, template_json: str, context: Mapping[str, Any]) -> dict[str, Any]:
        safe_context = {k: "" if v is None else str(v) for k, v in dict(context).items()}
        rendered = Template(template_json).safe_substitute(safe_context)
        try:
            parsed: Any = json.loads(rendered)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Webhook payload template is not valid JSON after substitution: {exc}") from exc
        if not isinstance(parsed, dict):
            raise ValueError("Webhook payload must be a JSON object (dict) at the top level.")
        return parsed

    def send(self, payload: Mapping[str, Any]) -> requests.Response:
        if not self.url:
            raise ValueError("Webhook URL is empty.")
        logger.debug("POST %s keys=%s", self.url, list(payload.keys()))
        return requests.post(
            self.url,
            json=dict(payload),
            timeout=self.timeout_seconds,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )

    def send_from_template(
        self, template_json: str, context: Mapping[str, Any]
    ) -> tuple[dict[str, Any], requests.Response]:
        body = self.build_payload(template_json, context)
        response = self.send(body)
        return body, response

    @staticmethod
    def parse_json_response(response: requests.Response) -> dict[str, Any] | None:
        if not response.content:
            return None
        try:
            data = response.json()
        except ValueError:
            logger.warning("Webhook response is not JSON (status=%s).", response.status_code)
            return None
        return data if isinstance(data, dict) else None
