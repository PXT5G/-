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

from proxy_manager import ProxyConfig, ProxyManager


STANDARD_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/136.0.0.0 Safari/537.36"
)

BLOCKED_RESOURCE_TYPES = {"image", "media", "font"}
TRACKER_HOST_KEYWORDS = (
    "doubleclick",
    "googlesyndication",
    "google-analytics",
    "analytics",
    "adservice",
    "adsystem",
    "facebook.net",
    "hotjar",
    "segment",
    "mixpanel",
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


@dataclass(frozen=True)
class DeviceProfile:
    """Transparent desktop profile for UX viewport and locale coverage."""

    name: str
    viewport: dict[str, int]
    screen: dict[str, int]
    locale: str
    timezone_id: str


DESKTOP_DEVICE_PROFILES = (
    DeviceProfile(
        name="desktop-us-1080p",
        viewport={"width": 1920, "height": 1080},
        screen={"width": 1920, "height": 1080},
        locale="en-US",
        timezone_id="America/New_York",
    ),
    DeviceProfile(
        name="desktop-us-1366",
        viewport={"width": 1366, "height": 768},
        screen={"width": 1366, "height": 768},
        locale="en-US",
        timezone_id="America/Chicago",
    ),
    DeviceProfile(
        name="desktop-gb-1536",
        viewport={"width": 1536, "height": 864},
        screen={"width": 1536, "height": 864},
        locale="en-GB",
        timezone_id="Europe/London",
    ),
    DeviceProfile(
        name="desktop-de-1440",
        viewport={"width": 1440, "height": 900},
        screen={"width": 1440, "height": 900},
        locale="de-DE",
        timezone_id="Europe/Berlin",
    ),
)


class BrowserEngine:
    """Small wrapper around Playwright browser lifecycle operations."""

    def __init__(
        self,
        behavior_settings: BehaviorSettings | None = None,
        proxy_manager: ProxyManager | None = None,
        user_agent: str = STANDARD_USER_AGENT,
    ) -> None:
        self.session: BrowserSession | None = None
        self.behavior_settings = behavior_settings or BehaviorSettings()
        self.proxy_manager = proxy_manager or ProxyManager()
        self.user_agent = user_agent
        self._mouse_position = (640.0, 400.0)
        self.current_proxy: ProxyConfig | None = None
        self.current_ip_address: str | None = None
        self.current_device_profile: DeviceProfile | None = None

    @property
    def is_running(self) -> bool:
        """Return True when a browser session has already been started."""
        return self.session is not None

    def start(
        self,
        headless: bool = False,
        simulate_network_latency: bool = True,
        block_heavy_resources: bool = True,
    ) -> BrowserSession:
        """Start a Chromium browser session for local testing."""
        if self.session is not None:
            return self.session

        playwright: Playwright | None = None
        browser: Browser | None = None
        try:
            playwright = sync_playwright().start()
            self.current_proxy = self.proxy_manager.get_next_proxy()
            self.current_ip_address = None
            self.current_device_profile = self._select_device_profile()

            launch_options: dict[str, object] = {"headless": headless}
            if self.current_proxy is not None:
                launch_options["proxy"] = self.current_proxy.to_playwright_proxy()

            browser = playwright.chromium.launch(**launch_options)
            context = browser.new_context(
                viewport=self.current_device_profile.viewport,
                screen=self.current_device_profile.screen,
                user_agent=self.user_agent,
                locale=self.current_device_profile.locale,
                timezone_id=self.current_device_profile.timezone_id,
                extra_http_headers={
                    "Accept-Language": self._accept_language_header(
                        self.current_device_profile.locale
                    )
                },
            )
            if simulate_network_latency or block_heavy_resources:
                context.route(
                    "**/*",
                    lambda route: self._route_with_controls(
                        route,
                        simulate_network_latency=simulate_network_latency,
                        block_heavy_resources=block_heavy_resources,
                    ),
                )
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

    def resolve_current_ip(self, timeout_ms: int = 15_000) -> str:
        """Resolve the browser-visible public IP address for logging."""
        if self.session is None:
            raise BrowserEngineError("Browser session has not been started.")

        ip_page = self.session.context.new_page()
        try:
            ip_page.goto(
                "https://api.ipify.org",
                wait_until="domcontentloaded",
                timeout=timeout_ms,
            )
            ip_address = ip_page.locator("body").inner_text(timeout=5_000).strip()
        except Exception as exc:
            raise BrowserEngineError("Unable to resolve browser IP address.") from exc
        finally:
            ip_page.close()

        self.current_ip_address = ip_address
        return ip_address

    def current_proxy_label(self) -> str:
        """Return a redacted label for the selected proxy."""
        if self.current_proxy is None:
            return "Direct connection"
        return self.current_proxy.redacted

    def current_device_profile_label(self) -> str:
        """Return a short label for the selected transparent device profile."""
        if self.current_device_profile is None:
            return "No device profile selected"
        width = self.current_device_profile.viewport["width"]
        height = self.current_device_profile.viewport["height"]
        return (
            f"{self.current_device_profile.name} "
            f"({width}x{height}, {self.current_device_profile.locale}, "
            f"{self.current_device_profile.timezone_id})"
        )

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

    def perform_local_warmup(self, page: Page | None = None) -> None:
        """Warm browser primitives on a local test page without external browsing."""
        active_page = self._get_page(page)
        warmup_blocks = "".join(
            f"<section class='warmup-block'>Warmup content block {index}</section>"
            for index in range(1, 24)
        )
        active_page.set_content(
            f"""
            <!doctype html>
            <html>
              <head>
                <style>
                  body {{
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background: #f8fafc;
                    color: #0f172a;
                  }}
                  .warmup-block {{
                    min-height: 220px;
                    margin: 18px;
                    padding: 24px;
                    border-radius: 14px;
                    background: white;
                    box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
                  }}
                  #warmup-target {{
                    margin: 18px;
                    padding: 18px;
                    border-radius: 12px;
                    background: #dbeafe;
                    cursor: default;
                  }}
                </style>
              </head>
              <body>
                <div id="warmup-target">Local non-link warmup target</div>
                {warmup_blocks}
              </body>
            </html>
            """,
            wait_until="domcontentloaded",
        )

        self.randomized_delay(0.15, 0.35)
        for _ in range(2):
            self.scroll_realistically(active_page)
        target = active_page.locator("#warmup-target").first
        target.wait_for(state="visible", timeout=2_000)
        box = target.bounding_box()
        if box is not None:
            self.move_mouse_naturally(
                box["x"] + box["width"] / 2,
                box["y"] + box["height"] / 2,
                active_page,
            )
            active_page.mouse.click(*self._mouse_position)
        self.randomized_delay(0.15, 0.35)

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
        self.current_proxy = None
        self.current_ip_address = None
        self.current_device_profile = None
        session.browser.close()
        session.playwright.stop()

    def _route_with_controls(
        self,
        route: Route,
        simulate_network_latency: bool,
        block_heavy_resources: bool,
    ) -> None:
        """Apply bandwidth-saving blocks and optional network delay."""
        if block_heavy_resources and self._should_block_request(route):
            route.abort()
            return

        if simulate_network_latency:
            min_ms, max_ms = self.behavior_settings.network_latency_ms
            time.sleep(random.uniform(min_ms, max_ms) / 1000)
        route.continue_()

    @staticmethod
    def _should_block_request(route: Route) -> bool:
        """Block heavy resources and common analytics/ad hosts for test speed."""
        request = route.request
        if request.resource_type in BLOCKED_RESOURCE_TYPES:
            return True

        url = request.url.lower()
        return any(keyword in url for keyword in TRACKER_HOST_KEYWORDS)

    def _get_page(self, page: Page | None = None) -> Page:
        """Return the requested page or the active session page."""
        if page is not None:
            return page
        if self.session is None:
            raise BrowserEngineError("Browser session has not been started.")
        return self.session.page

    def _select_device_profile(self) -> DeviceProfile:
        """Select a transparent UX profile, preferring proxy metadata when present."""
        if self.current_proxy is not None:
            proxy_profile_metadata = self.current_proxy.device_profile_metadata()
            if proxy_profile_metadata is not None:
                return DeviceProfile(**proxy_profile_metadata)
        return random.choice(DESKTOP_DEVICE_PROFILES)

    @staticmethod
    def _accept_language_header(locale: str) -> str:
        """Build a simple Accept-Language header from a locale."""
        language = locale.split("-", maxsplit=1)[0]
        if language == locale:
            return f"{locale};q=0.9,en;q=0.8"
        return f"{locale},{language};q=0.9,en;q=0.8"

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
