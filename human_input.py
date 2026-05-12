"""
Human-like keyboard input for the active browser page (Playwright).
"""

from __future__ import annotations

import logging
import random
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.sync_api import Page

logger = logging.getLogger(__name__)


def type_text_human_like(page: "Page", text: str) -> None:
    """
    Types ``text`` into the focused element using small random delays between keystrokes.
    """
    if not text:
        return
    for ch in text:
        delay_ms = random.randint(35, 120)
        page.keyboard.type(ch, delay=delay_ms)
        time.sleep(random.uniform(0.0, 0.04))


def inject_code_or_token(page: "Page | None", value: str) -> bool:
    """
    Focuses the active element (best-effort) and types ``value`` in a human-like way.

    Returns True if injection was attempted with a valid page.
    """
    if page is None:
        logger.warning("No active browser page; cannot inject webhook response.")
        return False
    trimmed = (value or "").strip()
    if not trimmed:
        return False
    try:
        page.bring_to_front()
    except Exception:
        pass
    type_text_human_like(page, trimmed)
    return True
