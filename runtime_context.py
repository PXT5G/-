"""
Runtime handles shared across GUI and automation (e.g. active Playwright page).
"""

from __future__ import annotations

from typing import Any, Optional

_active_page: Optional[Any] = None


def set_active_browser_page(page: Optional[Any]) -> None:
    global _active_page
    _active_page = page


def get_active_browser_page() -> Optional[Any]:
    return _active_page
