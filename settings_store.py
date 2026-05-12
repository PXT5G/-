"""Persistent automation settings (including webhook integration)."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

DEFAULT_SETTINGS_PATH = Path(__file__).resolve().parent / "automation_settings.json"


@dataclass
class WebhookIntegrationSettings:
    """Cross-system research integration: outbound webhook on resource errors."""

    enabled: bool = False
    target_url: str = ""
    # JSON body template; supports placeholders: {error_type}, {error_message}, {task_id}, {timestamp}
    json_template: str = (
        '{"event":"resource_error","type":"{error_type}","message":"{error_message}",'
        '"task_id":"{task_id}","timestamp":"{timestamp}"}'
    )
    # Seconds to wait for HTTP response (external solver / relay may be slow)
    response_timeout_sec: float = 120.0


@dataclass
class AutomationSettings:
    webhook: WebhookIntegrationSettings = field(default_factory=WebhookIntegrationSettings)

    def to_dict(self) -> dict[str, Any]:
        return {"webhook": asdict(self.webhook)}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AutomationSettings:
        wh = data.get("webhook") or {}
        return cls(
            webhook=WebhookIntegrationSettings(
                enabled=bool(wh.get("enabled", False)),
                target_url=str(wh.get("target_url", "")),
                json_template=str(
                    wh.get(
                        "json_template",
                        WebhookIntegrationSettings().json_template,
                    )
                ),
                response_timeout_sec=float(wh.get("response_timeout_sec", 120.0)),
            )
        )


def load_settings(path: Path | None = None) -> AutomationSettings:
    p = path or DEFAULT_SETTINGS_PATH
    if not p.is_file():
        return AutomationSettings()
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
        return AutomationSettings.from_dict(raw)
    except (json.JSONDecodeError, OSError, TypeError, ValueError):
        return AutomationSettings()


def save_settings(settings: AutomationSettings, path: Path | None = None) -> None:
    p = path or DEFAULT_SETTINGS_PATH
    p.write_text(json.dumps(settings.to_dict(), indent=2), encoding="utf-8")
