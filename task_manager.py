"""End-to-end test scenario orchestration.

This module is designed for authorized staging/sandbox environments. It reads
local test data, opens a Playwright session through BrowserEngine, performs
best-effort form interactions, and logs each step back to the UI.

It intentionally avoids real SMS procurement, CAPTCHA solving, or live payment
transactions. Payment form filling is limited to known sandbox card numbers.
"""

from __future__ import annotations

from datetime import datetime
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

from playwright.sync_api import Page, TimeoutError as PlaywrightTimeoutError

from api_handler import (
    CapSolverClient,
    FiveSimClient,
    IntegrationError,
    UnsupportedIntegrationOperation,
)
from browser_engine import BrowserEngine, BrowserEngineError


LogCallback = Callable[[str], None]

ACCOUNT_FILE = Path("accounts.txt")
CARD_FILE = Path("cards.txt")
SUCCESS_REPORT_FILE = Path("success_test_runs.txt")

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


class AutomatedTestScenario:
    """Coordinate a safe E2E lifecycle for staging integration tests."""

    def __init__(
        self,
        browser_engine: BrowserEngine,
        config: ScenarioConfig,
        log_callback: LogCallback | None = None,
    ) -> None:
        self.browser_engine = browser_engine
        self.config = config
        self.log_callback = log_callback or (lambda message: None)

    def run(self) -> None:
        """Execute the full test scenario with step-by-step logging."""
        self._log("E2E scenario started.")
        account = self._load_first_account()
        card = self._load_first_card()
        self._log(f"Loaded account: {self._mask_username(account.username)}")
        self._log(f"Loaded payment test card: {card.masked_number}")

        if not self.config.target_url:
            raise TaskManagerError("A target test URL is required.")

        session = self.browser_engine.start(headless=False)
        page = session.page
        self._log("Browser session ready with UX behavior settings.")

        self._navigate_to_test_page(page)
        self._attempt_account_flow(page, account)
        self._simulate_provider_checks(page)
        cleanup_completed = self._simulate_payment_lifecycle(page, card)
        if cleanup_completed:
            self._write_success_report(account, card)

        self._log("E2E scenario completed.")

    def _load_first_account(self) -> AccountData:
        """Load the first non-empty account row from accounts.txt."""
        line = self._read_first_data_line(self.config.accounts_path, "account")
        parts = [part.strip() for part in line.replace(",", "|").split("|")]
        if len(parts) < 2 or not parts[0] or not parts[1]:
            raise TaskManagerError("accounts.txt must contain username|password.")
        return AccountData(username=parts[0], password=parts[1])

    def _load_first_card(self) -> CardData:
        """Load the first non-empty test-card row from cards.txt."""
        line = self._read_first_data_line(self.config.cards_path, "card")
        parts = [part.strip() for part in line.split("|")]
        if len(parts) != 4 or not all(parts):
            raise TaskManagerError("cards.txt must contain Number|Month|Year|CVV.")
        return CardData(number=parts[0], month=parts[1], year=parts[2], cvv=parts[3])

    def _read_first_data_line(self, path: Path, label: str) -> str:
        """Return the first non-empty, non-comment line from a local data file."""
        if not path.exists():
            raise TaskManagerError(f"{path.name} is missing; add one {label} row first.")

        for line in path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                return stripped
        raise TaskManagerError(f"{path.name} does not contain any {label} rows.")

    def _navigate_to_test_page(self, page: Page) -> None:
        """Open the staging/login/register page."""
        self._log(f"Navigating to test page: {self.config.target_url}")
        page.goto(self.config.target_url, wait_until="domcontentloaded", timeout=45_000)
        self.browser_engine.randomized_delay()

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
            self._log("5sim key missing; simulated SMS metadata request skipped.")
            return

        client = FiveSimClient(self.config.five_sim_api_key)
        try:
            balance = client.check_balance()
        except IntegrationError as exc:
            self._log(f"5sim metadata check failed: {exc}")
            return

        self._log(
            "5sim metadata check completed; "
            f"balance={balance.get('balance', 'unknown')} {balance.get('currency', '')}."
        )
        try:
            client.purchase_number(service="sandbox")
        except UnsupportedIntegrationOperation as exc:
            self._log(f"Live SMS purchase blocked: {exc}")

    def _request_captcha_metadata(self) -> None:
        """Simulate solver readiness by checking CapSolver account status only."""
        if not self.config.capsolver_api_key:
            self._log("CapSolver key missing; simulated challenge metadata skipped.")
            return

        client = CapSolverClient(self.config.capsolver_api_key)
        try:
            balance = client.check_balance()
        except IntegrationError as exc:
            self._log(f"CapSolver metadata check failed: {exc}")
            return

        self._log(
            "CapSolver metadata check completed; "
            f"balance={balance.get('balance', 'unknown')}."
        )
        try:
            client.solve_captcha(
                website_url=self.config.target_url,
                website_key="detected-page-challenge",
            )
        except UnsupportedIntegrationOperation as exc:
            self._log(f"Live CAPTCHA solving blocked: {exc}")

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

    def _write_success_report(self, account: AccountData, card: CardData) -> None:
        """Write a non-sensitive success report for completed sandbox runs."""
        timestamp = datetime.now().isoformat(timespec="seconds")
        line = (
            f"{timestamp} | target={self.config.target_url} | "
            f"account={self._mask_username(account.username)} | card={card.masked_number}\n"
        )
        SUCCESS_REPORT_FILE.open("a", encoding="utf-8").write(line)
        self._log("Sandbox success report saved to success_test_runs.txt.")

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
                locator.fill(value)
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
        self.log_callback(message)
