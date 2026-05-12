"""
Persistent user settings (including webhook integration targets).
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict


DEFAULT_WEBHOOK_PAYLOAD_TEMPLATE = (
    "{\n"
    '  "event": "resource_error",\n'
    "  \"message\": {{message}},\n"
    "  \"task_id\": {{task_id}},\n"
    "  \"error_type\": {{error_type}}\n"
    "}"
)


@dataclass
class WebhookSettings:
    target_url: str = ""
    payload_template: str = field(default_factory=lambda: DEFAULT_WEBHOOK_PAYLOAD_TEMPLATE)
    request_timeout_seconds: float = 120.0


@dataclass
class AppSettings:
    webhooks: WebhookSettings = field(default_factory=WebhookSettings)

    def to_json_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_json_dict(cls, data: Dict[str, Any]) -> "AppSettings":
        wh = data.get("webhooks") or {}
        return cls(
            webhooks=WebhookSettings(
                target_url=str(wh.get("target_url", "") or ""),
                payload_template=str(wh.get("payload_template") or DEFAULT_WEBHOOK_PAYLOAD_TEMPLATE),
                request_timeout_seconds=float(wh.get("request_timeout_seconds", 120.0) or 120.0),
            )
        )


def default_settings_path() -> Path:
    base = os.environ.get("XDG_CONFIG_HOME") or str(Path.home() / ".config")
    return Path(base) / "automation_system" / "settings.json"


def load_settings(path: Path | None = None) -> AppSettings:
    p = path or default_settings_path()
    if not p.exists():
        return AppSettings()
    try:
        with p.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        if not isinstance(raw, dict):
            return AppSettings()
        return AppSettings.from_json_dict(raw)
    except (OSError, json.JSONDecodeError):
        return AppSettings()


def save_settings(settings: AppSettings, path: Path | None = None) -> None:
    p = path or default_settings_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(settings.to_json_dict(), f, indent=2, ensure_ascii=False)
    tmp.replace(p)
