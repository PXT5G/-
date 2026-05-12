"""
Task orchestration with resource-error detection and optional webhook callbacks.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any, Callable

from api_handler import GenericWebhook
from human_input import inject_code_or_token
from settings_store import IntegrationSettings, SettingsStore

if TYPE_CHECKING:
    from playwright.sync_api import Page

logger = logging.getLogger(__name__)

_RESOURCE_ERROR_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bresource\s+error\b", re.IGNORECASE),
    re.compile(r"\bsms\b", re.IGNORECASE),
    re.compile(r"\bcaptcha\b", re.IGNORECASE),
    re.compile(r"\b2fa\b", re.IGNORECASE),
    re.compile(r"\botp\b", re.IGNORECASE),
    re.compile(r"\bverification\s+code\b", re.IGNORECASE),
)


def is_resource_error(message: str) -> bool:
    text = (message or "").strip()
    if not text:
        return False
    return any(p.search(text) for p in _RESOURCE_ERROR_PATTERNS)


class TaskManager:
    """
    Central place to report failures. On resource errors, optionally calls a webhook
    and injects ``code`` / ``token`` from the JSON response into the active page.
    """

    def __init__(
        self,
        settings_store: SettingsStore,
        page_provider: Callable[[], "Page | None"] | None = None,
    ) -> None:
        self.settings_store = settings_store
        self.page_provider = page_provider

    def _active_page(self) -> "Page | None":
        if self.page_provider is None:
            return None
        try:
            return self.page_provider()
        except Exception:
            logger.exception("page_provider failed")
            return None

    def _integration(self) -> IntegrationSettings:
        return self.settings_store.integration

    def report_error(self, message: str, *, task_id: str = "", extra: dict[str, Any] | None = None) -> None:
        logger.error("Task error: %s", message)
        if not is_resource_error(message):
            return
        self._handle_resource_error(message, task_id=task_id, extra=extra or {})

    def _handle_resource_error(self, message: str, *, task_id: str, extra: dict[str, Any]) -> None:
        cfg = self._integration()
        if not cfg.webhook_enabled or not (cfg.webhook_url or "").strip():
            logger.info("Resource error detected; webhooks disabled or URL missing — skipping integration.")
            return

        category = "resource_error"
        for key in ("sms", "captcha", "2fa", "otp"):
            if re.search(rf"\b{re.escape(key)}\b", message, re.IGNORECASE):
                category = key.lower()
                break

        context: dict[str, Any] = {
            "message": message,
            "category": category,
            "task_id": task_id,
            **extra,
        }

        webhook = GenericWebhook(cfg.webhook_url, timeout_seconds=cfg.webhook_timeout_seconds)
        try:
            _sent_body, response = webhook.send_from_template(cfg.webhook_payload_template, context)
        except Exception:
            logger.exception("GenericWebhook failed for resource error.")
            return

        if not response.ok:
            logger.error("Webhook HTTP %s: %s", response.status_code, response.text[:500])
            return

        data = GenericWebhook.parse_json_response(response)
        if not data:
            return

        value = _extract_code_or_token(data)
        if not value:
            logger.info("Webhook returned JSON without top-level 'code' or 'token'.")
            return

        page = self._active_page()
        if inject_code_or_token(page, value):
            logger.info("Injected webhook credential into active page (length=%s).", len(value))


def _extract_code_or_token(payload: dict[str, Any]) -> str | None:
    for key in ("code", "token"):
        raw = payload.get(key)
        if raw is None:
            continue
        text = str(raw).strip()
        if text:
            return text
    return None
