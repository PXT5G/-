"""
Persistent user settings (including webhook integration).
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict

DEFAULT_WEBHOOK_TEMPLATE = (
    '{\n'
    '  "event": "resource_error",\n'
    '  "message": "{{message}}",\n'
    '  "error_type": "{{error_type}}"\n'
    "}\n"
)


@dataclass
class WebhookSettings:
    enabled: bool = False
    target_url: str = ""
    json_template: str = field(default_factory=lambda: DEFAULT_WEBHOOK_TEMPLATE)
    timeout_seconds: float = 120.0


@dataclass
class AppSettings:
    webhooks: WebhookSettings = field(default_factory=WebhookSettings)

    def to_json_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_json_dict(cls, data: Dict[str, Any]) -> "AppSettings":
        wh = data.get("webhooks") or {}
        webhooks = WebhookSettings(
            enabled=bool(wh.get("enabled", False)),
            target_url=str(wh.get("target_url", "") or ""),
            json_template=str(wh.get("json_template", DEFAULT_WEBHOOK_TEMPLATE) or DEFAULT_WEBHOOK_TEMPLATE),
            timeout_seconds=float(wh.get("timeout_seconds", 120.0) or 120.0),
        )
        return cls(webhooks=webhooks)


SETTINGS_PATH = Path(__file__).resolve().parent / "user_settings.json"


def load_settings(path: Path | None = None) -> AppSettings:
    p = path or SETTINGS_PATH
    if not p.exists():
        return AppSettings()
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            return AppSettings()
        return AppSettings.from_json_dict(raw)
    except (json.JSONDecodeError, OSError, TypeError, ValueError):
        return AppSettings()


def save_settings(settings: AppSettings, path: Path | None = None) -> None:
    p = path or SETTINGS_PATH
    p.write_text(json.dumps(settings.to_json_dict(), indent=2), encoding="utf-8")
