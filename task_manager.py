"""
Task coordination: resource-error detection, outbound webhooks, and response injection.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, Optional

from api_handler import GenericWebhook
from app_settings import AppSettings, WebhookSettings, load_settings
from human_typing import human_like_type_text

logger = logging.getLogger(__name__)

_RESOURCE_ERROR_PATTERNS = (
    re.compile(r"\bcaptcha\b", re.I),
    re.compile(r"\bsms\b", re.I),
    re.compile(r"\b2fa\b", re.I),
    re.compile(r"\bmfa\b", re.I),
    re.compile(r"\botp\b", re.I),
    re.compile(r"\bverification code\b", re.I),
    re.compile(r"\bphone verify\b", re.I),
    re.compile(r"\bresource error\b", re.I),
)


def is_resource_error_message(message: str) -> bool:
    """Heuristic match for SMS / Captcha / verification flows."""
    if not message or not message.strip():
        return False
    return any(p.search(message) for p in _RESOURCE_ERROR_PATTERNS)


def _apply_template(template: str, variables: Dict[str, Any]) -> str:
    out = template
    for key, value in variables.items():
        out = out.replace("{{" + key + "}}", str(value))
    return out


def build_webhook_payload(template: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    rendered = _apply_template(template, variables)
    data = json.loads(rendered)
    if not isinstance(data, dict):
        raise ValueError("Webhook JSON template must render to a JSON object (dict).")
    return data


def extract_code_or_token(response: Dict[str, Any]) -> Optional[str]:
    """
    Return the first non-empty ``code`` or ``token`` found in the response tree
    (``code`` is checked before ``token`` at each object level).
    """

    def walk(node: Any) -> Optional[str]:
        if isinstance(node, dict):
            for key in ("code", "token"):
                if key in node and node[key] not in (None, ""):
                    return str(node[key])
            for v in node.values():
                found = walk(v)
                if found is not None:
                    return found
        elif isinstance(node, list):
            for item in node:
                found = walk(item)
                if found is not None:
                    return found
        return None

    return walk(response)


class TaskManager:
    """
    Bridges browser automation with external systems via ``GenericWebhook``.
    """

    def __init__(self, settings: Optional[AppSettings] = None) -> None:
        self.settings = settings or load_settings()

    def reload_settings(self) -> None:
        self.settings = load_settings()

    def handle_automation_message(
        self,
        message: str,
        *,
        extra_context: Optional[Dict[str, Any]] = None,
        inject_response: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """
        Main hook: log ``message``; on resource errors, optionally fire webhook and inject reply.
        Returns webhook response dict when a webhook was sent, else None.
        """
        logger.info("Automation message: %s", message)
        if not is_resource_error_message(message):
            return None
        return self._on_resource_error(message, extra_context=extra_context, inject_response=inject_response)

    def _on_resource_error(
        self,
        message: str,
        *,
        extra_context: Optional[Dict[str, Any]] = None,
        inject_response: bool,
    ) -> Optional[Dict[str, Any]]:
        wh: WebhookSettings = self.settings.webhooks
        if not wh.enabled or not (wh.target_url or "").strip():
            logger.warning("Resource error detected but webhooks disabled or URL empty.")
            return None

        variables: Dict[str, Any] = {
            "message": message,
            "error_type": "resource_error",
            **(extra_context or {}),
        }

        try:
            payload = build_webhook_payload(wh.json_template, variables)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.exception("Invalid webhook JSON template: %s", exc)
            return None

        client = GenericWebhook(timeout=wh.timeout_seconds)
        try:
            response = client.post_json(wh.target_url.strip(), payload)
        except Exception as exc:  # pragma: no cover - network
            logger.exception("GenericWebhook failed: %s", exc)
            return None

        if inject_response:
            secret = extract_code_or_token(response)
            if secret:
                try:
                    human_like_type_text(secret)
                    logger.info("Injected webhook credential into active element.")
                except Exception as exc:  # pragma: no cover - browser state
                    logger.exception("Failed to type webhook response: %s", exc)
            else:
                logger.info("Webhook returned no code/token; nothing to inject.")

        return response
