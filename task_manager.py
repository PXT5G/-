"""
Task orchestration hooks, including Resource Error handling and webhook-based recovery.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Callable, Optional

from api_handler import GenericWebhook, extract_code_or_token
from browser_typing import try_human_like_type_into_focused
import runtime_context
from settings_store import AppSettings, load_settings

logger = logging.getLogger(__name__)

# Phrases commonly associated with SMS / Captcha / quota-style resource blocks.
_RESOURCE_ERROR_PATTERNS = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bresource error\b",
        r"\bsms\b",
        r"\bcaptcha\b",
        r"\bverification code\b",
        r"\bone[- ]time password\b",
        r"\botp\b",
        r"\brate limit\b",
        r"\b429\b",
        r"\bquota exceeded\b",
    )
)


def is_resource_error(message: str) -> bool:
    if not message:
        return False
    return any(p.search(message) for p in _RESOURCE_ERROR_PATTERNS)


def render_webhook_payload_template(template: str, context: dict[str, Any]) -> str:
    """
    Replace ``{{key}}`` placeholders with JSON-encoded values (safe for JSON templates).
    """
    out = template
    for key, value in context.items():
        token = "{{" + key + "}}"
        out = out.replace(token, json.dumps(value))
    return out


OptionalPageGetter = Callable[[], Any]


class TaskManager:
    """
    Minimal task manager surface: detects resource errors, notifies external systems,
    and optionally injects credentials returned by the webhook into the active page.
    """

    def __init__(
        self,
        settings: Optional[AppSettings] = None,
        get_active_page: Optional[OptionalPageGetter] = None,
    ):
        self.settings = settings or load_settings()
        self._get_active_page = get_active_page

    def reload_settings(self) -> None:
        self.settings = load_settings()

    def set_active_page_resolver(self, fn: Optional[OptionalPageGetter]) -> None:
        self._get_active_page = fn

    def on_error_message(self, message: str, *, task_id: str = "", error_type: str = "unknown") -> None:
        if not is_resource_error(message):
            logger.info("Non-resource error: %s", message)
            return
        self._handle_resource_error(message, task_id=task_id, error_type=error_type)

    def _handle_resource_error(self, message: str, *, task_id: str, error_type: str) -> None:
        logger.error("Resource error detected: %s", message)
        wh = self.settings.webhooks
        if not (wh.target_url or "").strip():
            logger.warning("Webhook URL not configured; skipping external integration")
            return

        try:
            payload_json = render_webhook_payload_template(
                wh.payload_template,
                {
                    "message": message,
                    "task_id": task_id,
                    "error_type": error_type,
                },
            )
        except Exception:
            logger.exception("Failed to render webhook payload template")
            return

        try:
            hook = GenericWebhook(wh.target_url, timeout=float(wh.request_timeout_seconds or 120.0))
            resp = hook.send_json_text(payload_json)
        except Exception:
            logger.exception("Webhook POST failed")
            return

        if resp.status_code >= 400:
            logger.warning("Webhook returned HTTP %s", resp.status_code)

        data = GenericWebhook.parse_response_json(resp)
        if data is None:
            return

        secret = extract_code_or_token(data)
        if not secret:
            logger.info("Webhook response contained no injectable code/token")
            return

        resolver = self._get_active_page or runtime_context.get_active_browser_page
        page = resolver()
        if try_human_like_type_into_focused(page, secret):
            logger.info("Injected webhook credential into active page")
