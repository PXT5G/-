"""
Human-like keyboard input for the active browser element.

Call ``set_webdriver`` from your automation bootstrap once the session exists.
"""

from __future__ import annotations

import logging
import random
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

_webdriver: Any = None


def set_webdriver(driver: Any) -> None:
    """Register the active Selenium WebDriver used for automation."""
    global _webdriver
    _webdriver = driver


def get_webdriver() -> Any:
    return _webdriver


def human_like_type_text(text: str, driver: Optional[Any] = None) -> None:
    """
    Type ``text`` into the currently focused element, character by character with jitter.
    """
    d = driver if driver is not None else _webdriver
    if d is None:
        raise RuntimeError("No WebDriver registered; call human_typing.set_webdriver(driver) first.")

    try:
        from selenium.webdriver.remote.webdriver import WebDriver
    except ImportError as exc:  # pragma: no cover - import guard
        raise RuntimeError("selenium is required for human_like_type_text") from exc

    if not isinstance(d, WebDriver):
        raise TypeError("driver must be a selenium WebDriver instance")

    active = d.switch_to.active_element
    for ch in text:
        active.send_keys(ch)
        time.sleep(random.uniform(0.04, 0.12))
    logger.debug("human_like_type_text: entered %d characters", len(text))
