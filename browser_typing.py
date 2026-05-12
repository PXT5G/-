"""
Human-like keyboard input for Playwright pages (optional dependency).
"""

from __future__ import annotations

import logging
import random
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)


def human_like_type_into_focused(page: Any, text: str) -> None:
    """
    Types into whatever element currently has focus on the page.
    Expects a Playwright sync ``Page`` with ``keyboard.press`` / ``keyboard.type`` API.
    """
    if not text:
        return
    keyboard = getattr(page, "keyboard", None)
    if keyboard is None:
        raise TypeError("Active page has no keyboard interface; expected Playwright Page")

    # Prefer per-character typing with jitter (more human-like than single burst).
    for ch in text:
        delay_ms = random.randint(35, 95)
        type_fn = getattr(keyboard, "type", None)
        press_fn = getattr(keyboard, "press", None)
        if callable(type_fn):
            type_fn(ch, delay=delay_ms)
        elif callable(press_fn):
            press_fn(ch, delay=delay_ms)
        else:
            raise TypeError("Keyboard object has neither type nor press")
        time.sleep(random.uniform(0.01, 0.04))


def try_human_like_type_into_focused(page: Optional[Any], text: str) -> bool:
    if page is None:
        logger.warning("No active browser page; cannot inject webhook credential")
        return False
    try:
        human_like_type_into_focused(page, text)
        return True
    except Exception:
        logger.exception("Failed to inject text into focused field")
        return False
