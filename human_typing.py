"""Human-like text entry for browser automation (Playwright / Selenium-friendly)."""

from __future__ import annotations

import logging
import random
import time
from typing import Any, Protocol

log = logging.getLogger(__name__)


class TypablePage(Protocol):
    """Minimal surface: anything with keyboard.type(text, delay=...)."""

    def keyboard(self) -> Any: ...


def _delay_ms() -> int:
    return random.randint(35, 95)


def type_like_human_playwright(page: TypablePage, text: str) -> None:
    """Type using Playwright's keyboard with per-key delay (human-like cadence)."""
    if not text:
        return
    try:
        page.keyboard.type(text, delay=_delay_ms())
    except Exception:
        log.exception("Playwright human typing failed")
        raise


def type_like_human_selenium(element: Any, text: str, *, clear_first: bool = True) -> None:
    """
    Type character-by-character into a Selenium WebElement with small sleeps.
    `element` should be a focused input/textarea WebElement.
    """
    if not text:
        return
    try:
        if clear_first:
            element.clear()
        for ch in text:
            element.send_keys(ch)
            time.sleep(random.uniform(0.03, 0.12))
    except Exception:
        log.exception("Selenium human typing failed")
        raise


def inject_code_or_token(
    *,
    playwright_page: TypablePage | None = None,
    selenium_element: Any | None = None,
    value: str,
) -> None:
    """
    Inject a code/token into the active page using whichever driver is configured.

    Exactly one of `playwright_page` or `selenium_element` should be set by the caller.
    """
    if not value:
        return
    if playwright_page is not None:
        type_like_human_playwright(playwright_page, value)
        return
    if selenium_element is not None:
        type_like_human_selenium(selenium_element, value)
        return
    log.warning("inject_code_or_token: no browser target configured; value not typed")
