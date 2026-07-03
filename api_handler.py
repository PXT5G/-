"""HTTP helpers for external API integration."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

import requests

log = logging.getLogger(__name__)


@dataclass
class WebhookPostResult:
    """Outcome of a generic webhook POST."""

    ok: bool
    status_code: int | None
    body_text: str
    parsed_json: dict[str, Any] | None


class GenericWebhook:
    """
    Sends arbitrary JSON POST payloads to external systems (relay, solver, lab API).

    Designed for cross-system research integration: one outbound contract, many backends.
    """

    def __init__(self, session: requests.Session | None = None) -> None:
        self._session = session or requests.Session()

    def post_json(
        self,
        url: str,
        payload: dict[str, Any],
        *,
        timeout_sec: float = 30.0,
        headers: dict[str, str] | None = None,
    ) -> WebhookPostResult:
        """
        POST JSON body. Waits for the HTTP response (use a generous timeout when the remote
        performs human-in-the-loop steps before responding with a code/token).
        """
        if not url or not url.strip():
            log.warning("GenericWebhook: empty URL, skipping POST")
            return WebhookPostResult(False, None, "", None)

        hdrs = {"Content-Type": "application/json", "Accept": "application/json"}
        if headers:
            hdrs.update(headers)

        try:
            resp = self._session.post(
                url.strip(),
                data=json.dumps(payload),
                headers=hdrs,
                timeout=timeout_sec,
            )
        except requests.RequestException as exc:
            log.exception("GenericWebhook POST failed: %s", exc)
            return WebhookPostResult(False, None, str(exc), None)

        text = resp.text or ""
        parsed: dict[str, Any] | None = None
        ctype = (resp.headers.get("Content-Type") or "").lower()
        if "json" in ctype or text.strip().startswith(("{", "[")):
            try:
                parsed_any = resp.json()
                if isinstance(parsed_any, dict):
                    parsed = parsed_any
                elif isinstance(parsed_any, list):
                    # Rare: top-level array; wrap for uniform downstream handling
                    parsed = {"_items": parsed_any}
            except ValueError:
                parsed = None

        ok = 200 <= resp.status_code < 300
        if not ok:
            log.warning(
                "GenericWebhook: HTTP %s — %s",
                resp.status_code,
                text[:500],
            )
        return WebhookPostResult(ok, resp.status_code, text, parsed)

    @staticmethod
    def extract_code_or_token(parsed: dict[str, Any] | None) -> str | None:
        """Return first non-empty string found under common keys used by relays."""
        if not parsed:
            return None
        for key in ("code", "token", "otp", "captcha_token", "solution"):
            val = parsed.get(key)
            if isinstance(val, str) and val.strip():
                return val.strip()
            if isinstance(val, (int, float)) and not isinstance(val, bool):
                s = str(val).strip()
                if s:
                    return s
        return None
