"""Browser automation core for the desktop dashboard.

This module intentionally uses normal Playwright browser automation for
transparent testing workflows. It does not include anti-detection or stealth
evasion behavior.
"""

from __future__ import annotations

import random
import time
from dataclasses import dataclass

from playwright.sync_api import (
    Browser,
    BrowserContext,
    Page,
    Playwright,
    Route,
    sync_playwright,
)


STANDARD_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0.0.0 Safari/537.36"
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


@dataclass(frozen=True)
class BehaviorSettings:
    """Timing and movement settings for user-experience test scenarios."""

    think_time_seconds: tuple[float, float] = (0.45, 1.6)
    click_pause_seconds: tuple[float, float] = (0.12, 0.35)
    network_latency_ms: tuple[int, int] = (120, 450)
    mouse_steps: tuple[int, int] = (18, 36)
    mouse_offset_px: int = 4
    scroll_delta_px: tuple[int, int] = (260, 760)
    scroll_pause_seconds: tuple[float, float] = (0.04, 0.16)


class BrowserEngine:
    """Small wrapper around Playwright browser lifecycle operations."""

    def __init__(
        self,
        behavior_settings: BehaviorSettings | None = None,
        user_agent: str = STANDARD_USER_AGENT,
    ) -> None:
        self.session: BrowserSession | None = None
        self.behavior_settings = behavior_settings or BehaviorSettings()
        self.user_agent = user_agent
        self._mouse_position = (640.0, 400.0)

    @property
    def is_running(self) -> bool:
        """Return True when a browser session has already been started."""
        return self.session is not None

    def start(
        self,
        headless: bool = False,
        simulate_network_latency: bool = True,
    ) -> BrowserSession:
        """Start a Chromium browser session for local testing."""
        if self.session is not None:
            return self.session

        playwright: Playwright | None = None
        browser: Browser | None = None
        try:
            playwright = sync_playwright().start()
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=self.user_agent,
                extra_http_headers={"Accept-Language": "en-US,en;q=0.9"},
            )
            if simulate_network_latency:
                context.route("**/*", self._route_with_latency)
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

    def randomized_delay(
        self,
        min_seconds: float | None = None,
        max_seconds: float | None = None,
    ) -> float:
        """Pause for a randomized think-time interval and return its duration."""
        default_min, default_max = self.behavior_settings.think_time_seconds
        min_delay = default_min if min_seconds is None else min_seconds
        max_delay = default_max if max_seconds is None else max_seconds
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
        return delay

    def move_mouse_naturally(
        self,
        target_x: float,
        target_y: float,
        page: Page | None = None,
    ) -> tuple[float, float]:
        """Move the mouse along a curved path with small target offsets."""
        active_page = self._get_page(page)
        start_x, start_y = self._mouse_position
        end_x, end_y = self._apply_target_offset(active_page, target_x, target_y)

        settings = self.behavior_settings
        steps = random.randint(*settings.mouse_steps)
        duration = random.uniform(0.35, 1.1)
        interval = duration / steps

        distance_x = end_x - start_x
        distance_y = end_y - start_y
        control_one = (
            start_x + distance_x * random.uniform(0.2, 0.4) + random.uniform(-90, 90),
            start_y + distance_y * random.uniform(0.1, 0.35) + random.uniform(-70, 70),
        )
        control_two = (
            start_x + distance_x * random.uniform(0.6, 0.85) + random.uniform(-90, 90),
            start_y + distance_y * random.uniform(0.65, 0.9) + random.uniform(-70, 70),
        )

        for step in range(1, steps + 1):
            t = step / steps
            eased_t = t * t * (3 - 2 * t)
            x, y = self._cubic_bezier(
                eased_t,
                (start_x, start_y),
                control_one,
                control_two,
                (end_x, end_y),
            )
            active_page.mouse.move(x, y)
            time.sleep(interval)

        self._mouse_position = (end_x, end_y)
        return self._mouse_position

    def scroll_realistically(
        self,
        page: Page | None = None,
        direction: str = "down",
        total_delta: int | None = None,
    ) -> int:
        """Scroll in several uneven wheel movements instead of one jump."""
        active_page = self._get_page(page)
        settings = self.behavior_settings
        delta = total_delta or random.randint(*settings.scroll_delta_px)
        if direction.lower() == "up":
            delta *= -1

        remaining = abs(delta)
        sign = 1 if delta >= 0 else -1
        moved = 0

        while remaining > 0:
            chunk = min(remaining, random.randint(45, 160))
            active_page.mouse.wheel(0, sign * chunk)
            remaining -= chunk
            moved += sign * chunk
            self.randomized_delay(*settings.scroll_pause_seconds)

        return moved

    def click_with_think_time(
        self,
        selector: str,
        page: Page | None = None,
    ) -> None:
        """Move to an element, pause briefly, click, then pause again."""
        active_page = self._get_page(page)
        self.randomized_delay()

        locator = active_page.locator(selector).first
        locator.wait_for(state="visible", timeout=10_000)
        box = locator.bounding_box()
        if box is None:
            raise BrowserEngineError(f"Unable to locate clickable element: {selector}")

        target_x = box["x"] + box["width"] * random.uniform(0.35, 0.65)
        target_y = box["y"] + box["height"] * random.uniform(0.35, 0.65)
        self.move_mouse_naturally(target_x, target_y, active_page)
        self.randomized_delay(*self.behavior_settings.click_pause_seconds)
        active_page.mouse.click(*self._mouse_position)
        self.randomized_delay()

    def stop(self) -> None:
        """Close the browser session and release Playwright resources."""
        if self.session is None:
            return

        session = self.session
        self.session = None
        session.browser.close()
        session.playwright.stop()

    def _route_with_latency(self, route: Route) -> None:
        """Add optional network delay before continuing each request."""
        min_ms, max_ms = self.behavior_settings.network_latency_ms
        time.sleep(random.uniform(min_ms, max_ms) / 1000)
        route.continue_()

    def _get_page(self, page: Page | None = None) -> Page:
        """Return the requested page or the active session page."""
        if page is not None:
            return page
        if self.session is None:
            raise BrowserEngineError("Browser session has not been started.")
        return self.session.page

    def _apply_target_offset(
        self,
        page: Page,
        target_x: float,
        target_y: float,
    ) -> tuple[float, float]:
        """Apply a small offset while keeping the target inside the viewport."""
        viewport = page.viewport_size or {"width": 1280, "height": 800}
        offset = self.behavior_settings.mouse_offset_px
        x = target_x + random.uniform(-offset, offset)
        y = target_y + random.uniform(-offset, offset)
        x = min(max(x, 0), viewport["width"] - 1)
        y = min(max(y, 0), viewport["height"] - 1)
        return x, y

    @staticmethod
    def _cubic_bezier(
        t: float,
        start: tuple[float, float],
        control_one: tuple[float, float],
        control_two: tuple[float, float],
        end: tuple[float, float],
    ) -> tuple[float, float]:
        """Calculate one point on a cubic Bezier curve."""
        inverse_t = 1 - t
        x = (
            inverse_t**3 * start[0]
            + 3 * inverse_t**2 * t * control_one[0]
            + 3 * inverse_t * t**2 * control_two[0]
            + t**3 * end[0]
        )
        y = (
            inverse_t**3 * start[1]
            + 3 * inverse_t**2 * t * control_one[1]
            + 3 * inverse_t * t**2 * control_two[1]
            + t**3 * end[1]
        )
        return x, y
