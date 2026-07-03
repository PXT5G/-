"""Task orchestration with resource-error handling and universal webhook integration."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from api_handler import GenericWebhook, WebhookPostResult
from human_typing import inject_code_or_token
from settings_store import AutomationSettings, WebhookIntegrationSettings, load_settings, save_settings

log = logging.getLogger(__name__)

# Phrases that indicate SMS / captcha / verification resource needs (case-insensitive)
_RESOURCE_ERROR_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"\bsms\b",
        r"\bcaptcha\b",
        r"\b2fa\b",
        r"\bmfa\b",
        r"\botp\b",
        r"\bverification\s*code\b",
        r"\bone[- ]time\b",
        r"\bphone\s*verification\b",
        r"\bresource\s*error\b",
    )
)


def is_resource_error(message: str | None) -> bool:
    if not message:
        return False
    return any(p.search(message) for p in _RESOURCE_ERROR_PATTERNS)


def render_webhook_json_template(
    template: str,
    *,
    error_type: str,
    error_message: str,
    task_id: str,
) -> dict[str, Any]:
    """
    Replace documented placeholders with JSON-safe string fragments, then parse JSON.

    Supported placeholders: {error_type}, {error_message}, {task_id}, {timestamp}
    """
    ts = datetime.now(timezone.utc).isoformat()

    def esc_fragment(s: str) -> str:
        return json.dumps(s)[1:-1]

    out = template
    out = out.replace("{error_type}", esc_fragment(error_type))
    out = out.replace("{error_message}", esc_fragment(error_message))
    out = out.replace("{task_id}", esc_fragment(task_id))
    out = out.replace("{timestamp}", esc_fragment(ts))
    return json.loads(out)


@dataclass
class BrowserTargets:
    """Active browser surfaces for response injection (optional)."""

    playwright_page: Any | None = None
    selenium_element: Any | None = None


class TaskManager:
    """
    Coordinates tasks and cross-system hooks. On resource errors, notifies an external
    HTTP endpoint and can inject returned credentials into the live page.
    """

    def __init__(
        self,
        *,
        settings_path: Path | None = None,
        browser: BrowserTargets | None = None,
        settings_loader: Callable[[], AutomationSettings] | None = None,
    ) -> None:
        self._settings_path = settings_path
        self._browser = browser or BrowserTargets()
        self._settings_loader = settings_loader or (lambda: load_settings(self._settings_path))

    def set_browser_targets(self, browser: BrowserTargets | None) -> None:
        self._browser = browser or BrowserTargets()

    def handle_resource_error(
        self,
        error_message: str,
        *,
        error_type: str = "resource_error",
        task_id: str = "",
    ) -> WebhookPostResult | None:
        """
        When SMS / captcha / similar resource friction is detected:

        1. Log (always).
        2. If webhook integration is enabled and configured, POST the JSON template.
        3. If the JSON response includes `code` or `token` (or common aliases), type it
           into the configured browser target using human-like delays.
        """
        log.warning("Resource error detected (%s): %s", error_type, error_message)

        settings = self._settings_loader()
        wh = settings.webhook
        if not wh.enabled or not wh.target_url.strip():
            log.info("Webhook integration disabled or URL missing; skipping outbound POST")
            return None

        try:
            payload = render_webhook_json_template(
                wh.json_template,
                error_type=error_type,
                error_message=error_message,
                task_id=task_id,
            )
        except (json.JSONDecodeError, ValueError) as exc:
            log.error("Invalid webhook JSON template after placeholder substitution: %s", exc)
            return None

        client = GenericWebhook()
        result = client.post_json(
            wh.target_url.strip(),
            payload,
            timeout_sec=max(5.0, float(wh.response_timeout_sec)),
        )

        secret = GenericWebhook.extract_code_or_token(result.parsed_json)
        if secret:
            log.info("Webhook returned credential material; injecting via human-like typing")
            inject_code_or_token(
                playwright_page=self._browser.playwright_page,
                selenium_element=self._browser.selenium_element,
                value=secret,
            )
        else:
            log.info(
                "Webhook completed (HTTP %s); no code/token in JSON for injection",
                result.status_code,
            )

        return result


def update_webhook_settings(
    webhook: WebhookIntegrationSettings,
    *,
    settings_path: Path | None = None,
) -> None:
    """Persist webhook tab changes merged into existing automation settings."""
    s = load_settings(settings_path)
    s.webhook = webhook
    save_settings(s, settings_path)
