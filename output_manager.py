"""CSV result logging for long-running load tests."""

from __future__ import annotations

import csv
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


RESULTS_DIR = Path("results")
SUCCESS_LOG = RESULTS_DIR / "success_log.csv"
FAILED_LOG = RESULTS_DIR / "failed_log.csv"
DAILY_SUMMARY = RESULTS_DIR / "daily_summary.txt"


@dataclass(frozen=True)
class ResultRecord:
    """One sanitized task result row."""

    thread_label: str
    account: str
    target_url: str
    status: str
    message: str
    card: str = ""


class OutputManager:
    """Write sanitized success and failure records to CSV files."""

    SUCCESS_HEADERS = ("timestamp", "thread", "account", "target_url", "card", "message")
    FAILED_HEADERS = ("timestamp", "thread", "account", "target_url", "status", "reason")

    def __init__(self, results_dir: Path = RESULTS_DIR) -> None:
        self.results_dir = results_dir
        self.success_log = results_dir / SUCCESS_LOG.name
        self.failed_log = results_dir / FAILED_LOG.name
        self.daily_summary = results_dir / DAILY_SUMMARY.name
        self._lock = threading.Lock()
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def record_success(self, record: ResultRecord) -> None:
        """Append one success row to results/success_log.csv."""
        with self._lock:
            self._append_row(
                self.success_log,
                self.SUCCESS_HEADERS,
                (
                    self._timestamp(),
                    record.thread_label,
                    record.account,
                    record.target_url,
                    record.card,
                    record.message,
                ),
            )

    def record_failure(self, record: ResultRecord) -> None:
        """Append one failure row to results/failed_log.csv."""
        with self._lock:
            self._append_row(
                self.failed_log,
                self.FAILED_HEADERS,
                (
                    self._timestamp(),
                    record.thread_label,
                    record.account,
                    record.target_url,
                    record.status,
                    record.message,
                ),
            )

    def append_daily_summary(
        self,
        thread_label: str,
        account: str,
        status: str,
        message: str,
    ) -> None:
        """Append one human-readable thread summary line."""
        line = (
            f"{self._timestamp()} | {thread_label} | {status} | "
            f"account={account} | {message}\n"
        )
        with self._lock:
            self.daily_summary.open("a", encoding="utf-8").write(line)

    @staticmethod
    def _append_row(path: Path, headers: tuple[str, ...], row: tuple[str, ...]) -> None:
        """Create a CSV with headers if needed, then append one row."""
        file_exists = path.exists()
        with path.open("a", newline="", encoding="utf-8") as csv_file:
            writer = csv.writer(csv_file)
            if not file_exists:
                writer.writerow(headers)
            writer.writerow(row)

    @staticmethod
    def _timestamp() -> str:
        """Return an ISO-like timestamp for CSV rows."""
        return datetime.now().isoformat(timespec="seconds")
