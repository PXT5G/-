"""End-to-end test scenario orchestration.

This module is designed for authorized staging/sandbox environments. It reads
local test data, opens a Playwright session through BrowserEngine, performs
best-effort form interactions, and logs each step back to the UI.

It intentionally avoids real SMS procurement, CAPTCHA solving, or live payment
transactions. Payment form filling is limited to known sandbox card numbers.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from queue import Empty, Queue
import time
from typing import Callable, Iterable

from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError

from api_handler import (
    CapSolverClient,
    FiveSimClient,
    IntegrationError,
    UnsupportedIntegrationOperation,
)
from browser_engine import BrowserEngine, BrowserEngineError
from output_manager import OutputManager, ResultRecord
from proxy_manager import ProxyManager


LogCallback = Callable[[str], None]

ACCOUNT_FILE = Path("accounts.txt")
CARD_FILE = Path("cards.txt")
MAX_CONCURRENT_THREADS = 5
ARTIFACTS_DIR = Path("results") / "artifacts"

SANDBOX_CARD_NUMBERS = {
    "4111111111111111",
    "4242424242424242",
    "4000000000003220",
    "5555555555554444",
}


class TaskManagerError(RuntimeError):
    """Raised when the E2E scenario cannot continue safely."""


@dataclass(frozen=True)
class AccountData:
    """One account row from accounts.txt."""

    username: str
    password: str


@dataclass(frozen=True)
class CardData:
    """One payment-card test row from cards.txt."""

    number: str
    month: str
    year: str
    cvv: str

    @property
    def masked_number(self) -> str:
        """Return a redacted card number for logs."""
        clean_number = "".join(character for character in self.number if character.isdigit())
        if len(clean_number) < 8:
            return "****"
        return f"{clean_number[:4]} **** **** {clean_number[-4:]}"

    @property
    def is_sandbox_card(self) -> bool:
        """Allow only recognized test-card numbers for form filling."""
        clean_number = "".join(character for character in self.number if character.isdigit())
        return clean_number in SANDBOX_CARD_NUMBERS


@dataclass(frozen=True)
class ScenarioConfig:
    """Runtime inputs for an E2E test scenario."""

    target_url: str
    five_sim_api_key: str = ""
    capsolver_api_key: str = ""
    accounts_path: Path = ACCOUNT_FILE
    cards_path: Path = CARD_FILE
    account: AccountData | None = None
    card: CardData | None = None
    max_recovery_attempts: int = 2


class AutomatedTestScenario:
    """Coordinate a safe E2E lifecycle for staging integration tests."""

    def __init__(
        self,
        browser_engine: BrowserEngine,
        config: ScenarioConfig,
        log_callback: LogCallback | None = None,
        thread_label: str = "Thread-1",
        output_manager: OutputManager | None = None,
    ) -> None:
        self.browser_engine = browser_engine
        self.config = config
        self.log_callback = log_callback or (lambda message: None)
        self.thread_label = thread_label
        self.output_manager = output_manager or OutputManager()

    def run(self) -> bool:
        """Execute the full test scenario with step-by-step logging."""
        self._log("E2E scenario started.")
        account = self.config.account or self._load_first_account()
        card = self.config.card or self._load_first_card()
        self._log(f"Loaded account: {self._mask_username(account.username)}")
        self._log(f"Loaded payment test card: {card.masked_number}")

        if not self.config.target_url:
            raise TaskManagerError("A target test URL is required.")

        session = self.browser_engine.start(headless=False)
        page = session.page
        self._log("Browser session ready with UX behavior settings.")
        self._log(f"Proxy route: {self.browser_engine.current_proxy_label()}")
        self._log(f"Device profile: {self.browser_engine.current_device_profile_label()}")
        self._log(f"User-Agent: {self.browser_engine.current_user_agent_label()}")
        try:
            current_ip = self.browser_engine.resolve_current_ip()
            self._log(f"Current browser IP address: {current_ip}")
        except BrowserEngineError as exc:
            self._log(f"Could not determine current browser IP address: {exc}")
            if self.browser_engine.current_proxy is not None:
                raise

        self._perform_pre_task_warmup(page)
        self._perform_precheck_tab_routine(page)
        self._navigate_to_test_page(page)
        self._attempt_account_flow(page, account)
        self._simulate_provider_checks(page)
        cleanup_completed = self._simulate_payment_lifecycle(page, card)
        if cleanup_completed:
            self._record_success(account, card)
        else:
            self._record_failure(
                account,
                "E2E flow completed without cleanup success.",
                artifact_path=self._capture_failure_artifact(page),
            )

        self._log("E2E scenario completed.")
        return cleanup_completed

    def _load_first_account(self) -> AccountData:
        """Load the first non-empty account row from accounts.txt."""
        accounts = load_accounts(self.config.accounts_path)
        if not accounts:
            raise TaskManagerError("accounts.txt does not contain any account rows.")
        return accounts[0]

    def _load_first_card(self) -> CardData:
        """Load the first non-empty test-card row from cards.txt."""
        cards = load_cards(self.config.cards_path)
        if not cards:
            raise TaskManagerError("cards.txt does not contain any card rows.")
        return cards[0]

    def _navigate_to_test_page(self, page: Page) -> None:
        """Open the staging/login/register page."""
        self._log(f"Navigating to test page: {self.config.target_url}")
        page.goto(self.config.target_url, wait_until="domcontentloaded", timeout=30_000)
        self.browser_engine.randomized_delay()

    def _perform_pre_task_warmup(self, page: Page) -> None:
        """Warm the browser locally before opening the target URL."""
        self._log("Running local pre-task warmup.")
        self.browser_engine.perform_local_warmup(page)
        self._log("Local pre-task warmup completed.")

    def _perform_precheck_tab_routine(self, page: Page) -> None:
        """Open a blank tab briefly to test distraction resilience."""
        self._log("Running pre-check blank tab routine.")
        self.browser_engine.perform_precheck_tab_switch(page)
        self._log("Pre-check blank tab routine completed.")

    def _attempt_account_flow(self, page: Page, account: AccountData) -> None:
        """Best-effort login/register field filling using common test selectors."""
        self._log("Searching for login/register fields.")
        filled_username = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='email']",
                "[data-testid='username']",
                "input[name='email']",
                "input[name='username']",
                "input[type='email']",
            ),
            value=account.username,
            label="account identifier",
        )
        filled_password = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='password']",
                "input[name='password']",
                "input[type='password']",
            ),
            value=account.password,
            label="password",
        )

        if filled_username and filled_password:
            self._click_first_available(
                page,
                selectors=(
                    "[data-testid='login-submit']",
                    "[data-testid='register-submit']",
                    "button[type='submit']",
                ),
                label="login/register submit",
            )
        else:
            self._log("Login/register fields were not fully available; continuing test.")

    def _simulate_provider_checks(self, page: Page) -> None:
        """Run safe provider checks when the page indicates SMS or CAPTCHA needs."""
        if self._page_contains_any(page, ("sms", "phone verification", "verification code")):
            self._request_sms_metadata()
        else:
            self._log("SMS verification signal not detected; skipping SMS metadata check.")

        if self._page_contains_any(page, ("captcha", "turnstile", "hcaptcha")):
            self._request_captcha_metadata()
        else:
            self._log("CAPTCHA signal not detected; skipping CAPTCHA metadata check.")

    def _request_sms_metadata(self) -> None:
        """Simulate provider readiness by checking 5sim account status only."""
        if not self.config.five_sim_api_key:
            raise TaskManagerError(
                "Resource Error: 5sim key missing while phone verification is required."
            )

        client = FiveSimClient(self.config.five_sim_api_key)
        try:
            latency_result = client.benchmark_profile_latency()
        except IntegrationError as exc:
            self._log(f"5sim metadata check failed: {exc}")
            if self._is_resource_error(str(exc)):
                raise TaskManagerError(f"Resource Error: {exc}") from exc
            raise

        self._log(
            "5sim latency benchmark completed; "
            f"{latency_result.get('latency_ms')}ms; "
            f"balance={latency_result.get('balance', 'unknown')} "
            f"{latency_result.get('currency', '')}."
        )
        endpoint_shape = client.benchmark_activation_endpoint_shape()
        self._log(
            "5sim activation endpoint shape recorded without live request: "
            f"{endpoint_shape.get('endpoint')}"
        )
        try:
            client.purchase_number(service="sandbox")
        except UnsupportedIntegrationOperation as exc:
            self._log(f"Live SMS purchase blocked: {exc}")
            raise TaskManagerError(
                "Resource Error: Phone verification requires manual sandbox fixture."
            ) from exc

    def _request_captcha_metadata(self) -> None:
        """Simulate solver readiness by checking CapSolver account status only."""
        if not self.config.capsolver_api_key:
            raise TaskManagerError(
                "Resource Error: CapSolver key missing while CAPTCHA is required."
            )

        client = CapSolverClient(self.config.capsolver_api_key)
        try:
            latency_result = client.benchmark_balance_latency()
        except IntegrationError as exc:
            self._log(f"CapSolver metadata check failed: {exc}")
            if self._is_resource_error(str(exc)):
                raise TaskManagerError(f"Resource Error: {exc}") from exc
            raise

        self._log(
            "CapSolver latency benchmark completed; "
            f"{latency_result.get('latency_ms')}ms; "
            f"balance={latency_result.get('balance', 'unknown')}."
        )
        endpoint_shape = client.benchmark_task_endpoint_shape(
            website_url=self.config.target_url,
            website_key="detected-page-challenge",
        )
        self._log(
            "CapSolver task endpoint shape recorded without live request: "
            f"{endpoint_shape.get('create_endpoint')} -> "
            f"{endpoint_shape.get('result_endpoint')}"
        )
        try:
            client.solve_captcha(
                website_url=self.config.target_url,
                website_key="detected-page-challenge",
            )
        except UnsupportedIntegrationOperation as exc:
            self._log(f"Live CAPTCHA solving blocked: {exc}")
            raise TaskManagerError(
                "Resource Error: CAPTCHA requires manual sandbox fixture."
            ) from exc

    def _simulate_payment_lifecycle(self, page: Page, card: CardData) -> bool:
        """Fill sandbox payment details and attempt cleanup when safe."""
        if not card.is_sandbox_card:
            self._log(
                "Payment simulation skipped: card is not a recognized sandbox test card."
            )
            return False

        self._log("Starting sandbox payment-method form simulation.")
        payment_fields_available = self._fill_payment_fields(page, card)
        if not payment_fields_available:
            self._log("Payment fields were not detected; payment simulation skipped.")
            return False

        cleanup_completed = False
        try:
            self._click_first_available(
                page,
                selectors=(
                    "[data-testid='save-payment-method']",
                    "[data-testid='submit-payment']",
                    "button[type='submit']",
                ),
                label="sandbox payment submit",
            )
            self._log("Sandbox payment step processed or submitted.")
        finally:
            cleanup_completed = self._cleanup_payment_method(page)
        return cleanup_completed

    def _fill_payment_fields(self, page: Page, card: CardData) -> bool:
        """Best-effort payment field filling for test-only card data."""
        filled_number = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='card-number']",
                "input[name='cardnumber']",
                "input[name='card_number']",
                "input[autocomplete='cc-number']",
            ),
            value=card.number,
            label="card number",
        )
        filled_month = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='card-month']",
                "input[name='exp-month']",
                "input[name='expiry_month']",
                "input[autocomplete='cc-exp-month']",
            ),
            value=card.month,
            label="card expiration month",
        )
        filled_year = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='card-year']",
                "input[name='exp-year']",
                "input[name='expiry_year']",
                "input[autocomplete='cc-exp-year']",
            ),
            value=card.year,
            label="card expiration year",
        )
        filled_cvv = self._fill_first_available(
            page,
            selectors=(
                "[data-testid='card-cvv']",
                "input[name='cvc']",
                "input[name='cvv']",
                "input[autocomplete='cc-csc']",
            ),
            value=card.cvv,
            label="card security code",
        )
        return all((filled_number, filled_month, filled_year, filled_cvv))

    def _cleanup_payment_method(self, page: Page) -> bool:
        """Attempt to remove the sandbox payment method after the test."""
        self._log("Starting cleanup: remove payment method.")
        clicked = self._click_first_available(
            page,
            selectors=(
                "[data-testid='remove-payment-method']",
                "[data-testid='delete-payment-method']",
                "button:has-text('Remove Payment Method')",
                "button:has-text('Remove')",
                "button:has-text('Delete')",
            ),
            label="remove payment method",
            required=False,
        )
        if clicked:
            confirmed = self._click_first_available(
                page,
                selectors=(
                    "[data-testid='confirm-remove-payment-method']",
                    "[data-testid='confirm-delete-payment-method']",
                    "button:has-text('Confirm')",
                    "button:has-text('Yes')",
                ),
                label="confirm payment method removal",
                required=False,
            )
            self._log("Cleanup step completed or confirmation attempted.")
            return confirmed or clicked
        else:
            self._log("Cleanup control not found; no payment method was removed.")
            return False

    def _record_success(self, account: AccountData, card: CardData) -> None:
        """Record a sanitized success for internal UI/result tracking."""
        masked_account = self._mask_username(account.username)
        self.output_manager.record_success(
            ResultRecord(
                thread_label=self.thread_label,
                account=masked_account,
                target_url=self.config.target_url,
                status="success",
                card=card.masked_number,
                proxy=self.browser_engine.current_proxy_label(),
                message="Sandbox E2E flow completed with cleanup.",
            )
        )
        self._log("Success result saved to results/success_log.csv.")

    def _record_failure(
        self,
        account: AccountData,
        reason: str,
        artifact_path: str = "",
    ) -> None:
        """Record a sanitized scenario-level failure."""
        self.output_manager.record_failure(
            ResultRecord(
                thread_label=self.thread_label,
                account=self._mask_username(account.username),
                target_url=self.config.target_url,
                status="failed",
                message=reason,
                artifact_path=artifact_path,
            )
        )
        self._log("Failure result saved to results/failed_log.csv.")

    def _capture_failure_artifact(self, page: Page | None = None) -> str:
        """Capture a screenshot or HTML snapshot for failure review."""
        if page is None:
            return ""

        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_thread = self.thread_label.replace(" ", "-").replace("/", "-")
        screenshot_path = ARTIFACTS_DIR / f"{safe_thread}-{timestamp}.png"
        html_path = ARTIFACTS_DIR / f"{safe_thread}-{timestamp}.html"

        try:
            page.screenshot(path=str(screenshot_path), full_page=True)
            return str(screenshot_path)
        except Exception:
            try:
                html_path.write_text(page.content(), encoding="utf-8")
                return str(html_path)
            except Exception:
                return ""

    def _fill_first_available(
        self,
        page: Page,
        selectors: Iterable[str],
        value: str,
        label: str,
    ) -> bool:
        """Fill the first visible field from a list of common selectors."""
        for selector in selectors:
            locator = page.locator(selector).first
            try:
                locator.wait_for(state="visible", timeout=1_000)
                self.browser_engine.type_text_naturally(locator, value, page)
            except PlaywrightTimeoutError:
                continue
            except Exception as exc:
                self._log(f"Could not fill {label} via {selector}: {exc}")
                continue

            self.browser_engine.randomized_delay(0.12, 0.45)
            self._log(f"Filled {label}.")
            return True

        self._log(f"No visible field found for {label}.")
        return False

    def _click_first_available(
        self,
        page: Page,
        selectors: Iterable[str],
        label: str,
        required: bool = False,
    ) -> bool:
        """Click the first visible control using BrowserEngine click pacing."""
        for selector in selectors:
            try:
                self.browser_engine.click_with_think_time(selector, page)
            except (PlaywrightTimeoutError, BrowserEngineError):
                continue
            except Exception as exc:
                self._log(f"Could not click {label} via {selector}: {exc}")
                continue

            self._log(f"Clicked {label}.")
            return True

        message = f"No visible control found for {label}."
        if required:
            raise TaskManagerError(message)
        self._log(message)
        return False

    @staticmethod
    def _page_contains_any(page: Page, words: Iterable[str]) -> bool:
        """Check visible page text for integration signals."""
        try:
            body_text = page.locator("body").inner_text(timeout=2_000).lower()
        except Exception:
            return False
        return any(word.lower() in body_text for word in words)

    @staticmethod
    def _is_resource_error(message: str) -> bool:
        """Detect provider resource errors for dashboard categorization."""
        normalized = message.lower()
        resource_markers = (
            "no funds",
            "insufficient funds",
            "no numbers",
            "no number",
            "no balance",
            "zero balance",
            "resource",
        )
        return any(marker in normalized for marker in resource_markers)

    @staticmethod
    def _mask_username(username: str) -> str:
        """Avoid logging full account identifiers."""
        if "@" in username:
            local, domain = username.split("@", 1)
            masked_local = f"{local[:2]}***" if len(local) > 2 else "***"
            return f"{masked_local}@{domain}"
        if len(username) <= 3:
            return "***"
        return f"{username[:2]}***{username[-1]}"

    def _log(self, message: str) -> None:
        """Send a scenario event to the UI log callback."""
        self.log_callback(f"[{self.thread_label}] {message}")


class ConcurrentTaskRunner:
    """Run multiple isolated E2E scenarios concurrently."""

    def __init__(
        self,
        proxy_manager: ProxyManager,
        base_config: ScenarioConfig,
        log_callback: LogCallback | None = None,
        output_manager: OutputManager | None = None,
    ) -> None:
        self.proxy_manager = proxy_manager
        self.base_config = base_config
        self.log_callback = log_callback or (lambda message: None)
        self.output_manager = output_manager or OutputManager()

    def run(self, thread_count: int) -> None:
        """Execute up to five browser sessions in parallel."""
        thread_count = self._normalize_thread_count(thread_count)
        accounts = load_accounts(self.base_config.accounts_path)
        cards = load_cards(self.base_config.cards_path)
        self._validate_unique_inputs(thread_count, accounts, cards)
        account_queue: Queue[AccountData] = Queue()
        card_queue: Queue[CardData] = Queue()
        for index in range(thread_count):
            account_queue.put(accounts[index])
            card_queue.put(cards[index])
        for index in range(thread_count, len(accounts)):
            account_queue.put(accounts[index])
        for index in range(thread_count, len(cards)):
            card_queue.put(cards[index])

        self._log("Runner", f"Starting {thread_count} concurrent E2E session(s).")
        with ThreadPoolExecutor(max_workers=thread_count) as executor:
            futures = [
                executor.submit(
                    self._run_single_thread,
                    index,
                    account_queue,
                    card_queue,
                )
                for index in range(1, thread_count + 1)
            ]

            for future in as_completed(futures):
                future.result()

        self._log("Runner", "All concurrent E2E sessions finished.")

    def _run_single_thread(
        self,
        index: int,
        account_queue: Queue[AccountData],
        card_queue: Queue[CardData],
    ) -> None:
        """Run one isolated scenario with its own BrowserEngine."""
        thread_label = f"Thread-{index}"
        max_attempts = self.base_config.max_recovery_attempts + 1
        last_error = "No attempts were run."

        for attempt in range(1, max_attempts + 1):
            attempt_started_at = time.perf_counter()
            try:
                account = account_queue.get_nowait()
                card = card_queue.get_nowait()
            except Empty:
                self._log(thread_label, "No unused account/card pair left for recovery.")
                self.output_manager.append_daily_summary(
                    thread_label,
                    "unavailable",
                    "failed",
                    f"Exhausted data after error: {last_error}",
                )
                return

            browser_engine = BrowserEngine(proxy_manager=self.proxy_manager)
            config = ScenarioConfig(
                target_url=self.base_config.target_url,
                five_sim_api_key=self.base_config.five_sim_api_key,
                capsolver_api_key=self.base_config.capsolver_api_key,
                accounts_path=self.base_config.accounts_path,
                cards_path=self.base_config.cards_path,
                account=account,
                card=card,
                max_recovery_attempts=self.base_config.max_recovery_attempts,
            )

            try:
                self._log(thread_label, f"Attempt {attempt}/{max_attempts} started.")
                scenario = AutomatedTestScenario(
                    browser_engine=browser_engine,
                    config=config,
                    log_callback=self.log_callback,
                    thread_label=thread_label,
                    output_manager=self.output_manager,
                )
                succeeded = scenario.run()
                status = "success" if succeeded else "completed_without_success"
                self.output_manager.append_daily_summary(
                    thread_label,
                    AutomatedTestScenario._mask_username(account.username),
                    status,
                    f"Attempt {attempt}/{max_attempts} finished.",
                    duration_seconds=time.perf_counter() - attempt_started_at,
                )
                return
            except Exception as exc:
                last_error = str(exc)
                artifact_path = self._capture_runner_artifact(browser_engine, thread_label)
                self._record_failure(thread_label, account, last_error, artifact_path)
                self._log(
                    thread_label,
                    f"Attempt {attempt}/{max_attempts} failed: {last_error}",
                )
                if attempt < max_attempts:
                    self._log(
                        thread_label,
                        "Recovering with a fresh browser, proxy, account, and card.",
                    )
                else:
                    self.output_manager.append_daily_summary(
                        thread_label,
                        AutomatedTestScenario._mask_username(account.username),
                        "failed",
                        f"All recovery attempts exhausted: {last_error}",
                        duration_seconds=time.perf_counter() - attempt_started_at,
                    )
            finally:
                browser_engine.stop()
                self._log(thread_label, "Browser resources released.")

    def _validate_unique_inputs(
        self,
        thread_count: int,
        accounts: list[AccountData],
        cards: list[CardData],
    ) -> None:
        """Ensure each worker receives unique local data and proxy capacity."""
        if len(accounts) < thread_count:
            raise TaskManagerError(
                f"Need at least {thread_count} account rows for concurrent execution."
            )
        if len(cards) < thread_count:
            raise TaskManagerError(
                f"Need at least {thread_count} card rows for concurrent execution."
            )
        if thread_count > 1 and len(self.proxy_manager.proxies) < thread_count:
            raise TaskManagerError(
                f"Need at least {thread_count} proxies for concurrent geographic testing."
            )

    @staticmethod
    def _normalize_thread_count(thread_count: int) -> int:
        """Clamp thread count to the supported range."""
        if thread_count < 1:
            raise TaskManagerError("Threads Count must be at least 1.")
        if thread_count > MAX_CONCURRENT_THREADS:
            raise TaskManagerError(
                f"Threads Count cannot exceed {MAX_CONCURRENT_THREADS}."
            )
        return thread_count

    def _log(self, label: str, message: str) -> None:
        """Send runner-level events with a clear label."""
        self.log_callback(f"[{label}] {message}")

    def _record_failure(
        self,
        thread_label: str,
        account: AccountData,
        reason: str,
        artifact_path: str = "",
    ) -> None:
        """Record one sanitized failure row."""
        self.output_manager.record_failure(
            ResultRecord(
                thread_label=thread_label,
                account=AutomatedTestScenario._mask_username(account.username),
                target_url=self.base_config.target_url,
                status="failed",
                message=reason,
                error_category=self._categorize_error(reason),
                artifact_path=artifact_path,
            )
        )

    @staticmethod
    def _capture_runner_artifact(
        browser_engine: BrowserEngine,
        thread_label: str,
    ) -> str:
        """Capture a failure artifact from a runner-owned browser."""
        if browser_engine.session is None:
            return ""
        ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_thread = thread_label.replace(" ", "-").replace("/", "-")
        screenshot_path = ARTIFACTS_DIR / f"{safe_thread}-{timestamp}-runner.png"
        html_path = ARTIFACTS_DIR / f"{safe_thread}-{timestamp}-runner.html"
        page = browser_engine.session.page
        try:
            page.screenshot(path=str(screenshot_path), full_page=True)
            return str(screenshot_path)
        except Exception:
            try:
                html_path.write_text(page.content(), encoding="utf-8")
                return str(html_path)
            except Exception:
                return ""

    @staticmethod
    def _categorize_error(reason: str) -> str:
        """Map raw error messages to dashboard-friendly categories."""
        normalized = reason.lower()
        if "proxy" in normalized or "ip address" in normalized:
            return "Proxy"
        if (
            "resource error" in normalized
            or "no funds" in normalized
            or "insufficient funds" in normalized
            or "no numbers" in normalized
            or "manual sandbox fixture" in normalized
        ):
            return "Resource Error"
        if "timeout" in normalized or "page" in normalized or "load" in normalized:
            return "Navigation"
        if "account" in normalized or "card" in normalized or "data" in normalized:
            return "Input Data"
        if "api" in normalized:
            return "Integration"
        return "Runtime"


def load_accounts(path: Path = ACCOUNT_FILE) -> list[AccountData]:
    """Load all account rows from accounts.txt."""
    rows = _read_data_lines(path, "account")
    accounts: list[AccountData] = []
    for index, line in enumerate(rows, start=1):
        parts = [part.strip() for part in line.replace(",", "|").split("|")]
        if len(parts) < 2 or not parts[0] or not parts[1]:
            raise TaskManagerError(
                f"Invalid account row {index}; expected username|password."
            )
        accounts.append(AccountData(username=parts[0], password=parts[1]))
    return accounts


def load_cards(path: Path = CARD_FILE) -> list[CardData]:
    """Load all card rows from cards.txt."""
    rows = _read_data_lines(path, "card")
    cards: list[CardData] = []
    for index, line in enumerate(rows, start=1):
        parts = [part.strip() for part in line.split("|")]
        if len(parts) != 4 or not all(parts):
            raise TaskManagerError(
                f"Invalid card row {index}; expected Number|Month|Year|CVV."
            )
        cards.append(CardData(number=parts[0], month=parts[1], year=parts[2], cvv=parts[3]))
    return cards


def _read_data_lines(path: Path, label: str) -> list[str]:
    """Return non-empty, non-comment rows from a local data file."""
    if not path.exists():
        raise TaskManagerError(f"{path.name} is missing; add {label} rows first.")

    rows = [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    if not rows:
        raise TaskManagerError(f"{path.name} does not contain any {label} rows.")
    return rows
