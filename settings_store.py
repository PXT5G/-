"""
Persistent integration settings (webhook URL, JSON template, timeouts).
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


DEFAULT_PAYLOAD_TEMPLATE = (
    '{"event": "resource_error", "category": "$category", "message": "$message", "task_id": "$task_id"}'
)


@dataclass
class IntegrationSettings:
    webhook_enabled: bool = False
    webhook_url: str = ""
    webhook_payload_template: str = DEFAULT_PAYLOAD_TEMPLATE
    webhook_timeout_seconds: float = 45.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> IntegrationSettings:
        if not data:
            return cls()
        return cls(
            webhook_enabled=bool(data.get("webhook_enabled", False)),
            webhook_url=str(data.get("webhook_url", "") or ""),
            webhook_payload_template=str(
                data.get("webhook_payload_template") or DEFAULT_PAYLOAD_TEMPLATE
            ),
            webhook_timeout_seconds=float(data.get("webhook_timeout_seconds", 45.0) or 45.0),
        )


class SettingsStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or Path(__file__).resolve().parent / "settings.json"
        self.integration = IntegrationSettings()

    def load(self) -> None:
        if not self.path.exists():
            return
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        block = raw.get("integration") if isinstance(raw, dict) else None
        self.integration = IntegrationSettings.from_dict(block if isinstance(block, dict) else raw)

    def save(self) -> None:
        payload = {"integration": self.integration.to_dict()}
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
