"""Browser automation core for the desktop dashboard.

This module intentionally uses normal Playwright browser automation for
transparent testing workflows. It does not include anti-detection or stealth
evasion behavior.
"""

from __future__ import annotations

from dataclasses import dataclass

from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    sync_playwright,
)


class BrowserEngineError(RuntimeError):
    """Raised when the browser engine cannot complete an operation."""


@dataclass
class BrowserSession:
    """Container for active Playwright objects."""

    playwright: Playwright
    browser: Browser
    context: BrowserContext
    page: Page


class BrowserEngine:
    """Small wrapper around Playwright browser lifecycle operations."""

    def __init__(self) -> None:
        self.session: BrowserSession | None = None

    @property
    def is_running(self) -> bool:
        """Return True when a browser session has already been started."""
        return self.session is not None

    def start(self, headless: bool = False) -> BrowserSession:
        """Start a Chromium browser session for local testing."""
        if self.session is not None:
            return self.session

        playwright: Playwright | None = None
        browser: Browser | None = None
        try:
            playwright = sync_playwright().start()
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()
        except Exception as exc:
            if browser is not None:
                browser.close()
            if playwright is not None:
                playwright.stop()
            raise BrowserEngineError("Failed to start Playwright browser session.") from exc

        self.session = BrowserSession(
            playwright=playwright,
            browser=browser,
            context=context,
            page=page,
        )
        return self.session

    def stop(self) -> None:
        """Close the browser session and release Playwright resources."""
        if self.session is None:
            return

        session = self.session
        self.session = None
        session.browser.close()
        session.playwright.stop()
