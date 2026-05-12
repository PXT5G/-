"""CSV result logging for long-running load tests."""

from __future__ import annotations

import csv
import shutil
import json
import re
import threading
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


RESULTS_DIR = Path("results")
SUCCESS_LOG = RESULTS_DIR / "success_log.csv"
FAILED_LOG = RESULTS_DIR / "failed_log.csv"
DAILY_SUMMARY = RESULTS_DIR / "daily_summary.txt"
ERROR_REPORT = RESULTS_DIR / "error_report.json"


@dataclass(frozen=True)
class ResultRecord:
    """One sanitized task result row."""

    thread_label: str
    account: str
    target_url: str
    status: str
    message: str
    card: str = ""
    error_category: str = "General"
    artifact_path: str = ""
    proxy: str = ""


class OutputManager:
    """Write sanitized success and failure records to CSV files."""

    SUCCESS_HEADERS = (
        "timestamp",
        "thread",
        "account",
        "target_url",
        "card",
        "proxy",
        "message",
    )
    FAILED_HEADERS = ("timestamp", "thread", "account", "target_url", "status", "reason")

    def __init__(self, results_dir: Path = RESULTS_DIR) -> None:
        self.results_dir = results_dir
        self.success_log = results_dir / SUCCESS_LOG.name
        self.failed_log = results_dir / FAILED_LOG.name
        self.daily_summary = results_dir / DAILY_SUMMARY.name
        self.error_report = results_dir / ERROR_REPORT.name
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
                    record.proxy,
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
            self._append_error_report(record)

    def append_daily_summary(
        self,
        thread_label: str,
        account: str,
        status: str,
        message: str,
        duration_seconds: float | None = None,
    ) -> None:
        """Append one human-readable thread summary line."""
        duration_text = (
            f" | duration={duration_seconds:.2f}s" if duration_seconds is not None else ""
        )
        line = (
            f"{self._timestamp()} | {thread_label} | {status} | "
            f"account={account} | {message}{duration_text}\n"
        )
        with self._lock:
            self.daily_summary.open("a", encoding="utf-8").write(line)

    def get_dashboard_metrics(
        self,
        active_threads: int,
        proxy_count: int,
        proxy_has_error: bool,
    ) -> dict[str, str]:
        """Read current dashboard counters from result files."""
        success_count = self._count_csv_rows(self.success_log)
        failed_count = self._count_csv_rows(self.failed_log)
        proxy_health = "Direct"
        if proxy_count > 0:
            proxy_health = "0%" if proxy_has_error else "100%"

        avg_duration = self._average_duration()
        avg_task_time = "N/A" if avg_duration is None else f"{avg_duration:.1f}s"

        return {
            "active_threads": str(active_threads),
            "total_success": str(success_count),
            "total_failed": str(failed_count),
            "proxy_health": proxy_health,
            "avg_task_time": avg_task_time,
        }

    def get_result_counts(self) -> tuple[int, int]:
        """Return success and failure counts."""
        return self._count_csv_rows(self.success_log), self._count_csv_rows(self.failed_log)

    def get_success_records(self, limit: int | None = None) -> list[dict[str, str]]:
        """Return success rows from results/success_log.csv."""
        rows = self._read_csv_rows(self.success_log)
        if limit is None:
            return rows
        return rows[-limit:]

    def export_success_log(self, destination: Path) -> Path:
        """Copy the success CSV to a user-selected destination."""
        self.results_dir.mkdir(parents=True, exist_ok=True)
        if not self.success_log.exists():
            with self.success_log.open("w", newline="", encoding="utf-8") as csv_file:
                csv.writer(csv_file).writerow(self.SUCCESS_HEADERS)
        shutil.copyfile(self.success_log, destination)
        return destination

    def get_error_reports(self, filter_text: str = "") -> list[dict[str, str]]:
        """Return saved error reports, optionally filtered by text."""
        with self._lock:
            if not self.error_report.exists():
                return []
            try:
                data = json.loads(self.error_report.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                return []

        if not isinstance(data, list):
            return []

        reports = [item for item in data if isinstance(item, dict)]
        if not filter_text:
            return reports

        normalized_filter = filter_text.lower()
        return [
            item
            for item in reports
            if normalized_filter
            in " ".join(str(value).lower() for value in item.values())
        ]

    @staticmethod
    def _append_row(path: Path, headers: tuple[str, ...], row: tuple[str, ...]) -> None:
        """Create a CSV with headers if needed, then append one row."""
        file_exists = path.exists()
        with path.open("a", newline="", encoding="utf-8") as csv_file:
            writer = csv.writer(csv_file)
            if not file_exists:
                writer.writerow(headers)
            writer.writerow(row)

    def _append_error_report(self, record: ResultRecord) -> None:
        """Append one structured failure entry to results/error_report.json."""
        entries: list[dict[str, str]] = []
        if self.error_report.exists():
            try:
                loaded = json.loads(self.error_report.read_text(encoding="utf-8"))
                if isinstance(loaded, list):
                    entries = [item for item in loaded if isinstance(item, dict)]
            except json.JSONDecodeError:
                entries = []

        entries.append(
            {
                "timestamp": self._timestamp(),
                "thread_id": record.thread_label,
                "category": record.error_category,
                "description": record.message,
                "account": record.account,
                "target_url": record.target_url,
                "artifact_path": record.artifact_path,
            }
        )
        self.error_report.write_text(json.dumps(entries, indent=2), encoding="utf-8")

    @staticmethod
    def _count_csv_rows(path: Path) -> int:
        """Count CSV data rows excluding the header."""
        if not path.exists():
            return 0
        with path.open("r", newline="", encoding="utf-8") as csv_file:
            return max(sum(1 for _ in csv_file) - 1, 0)

    @staticmethod
    def _read_csv_rows(path: Path) -> list[dict[str, str]]:
        """Read CSV rows as dictionaries."""
        if not path.exists():
            return []
        with path.open("r", newline="", encoding="utf-8") as csv_file:
            return list(csv.DictReader(csv_file))

    def _average_duration(self) -> float | None:
        """Calculate average task duration from daily summary lines."""
        if not self.daily_summary.exists():
            return None

        durations: list[float] = []
        pattern = re.compile(r"duration=(\d+(?:\.\d+)?)s")
        for line in self.daily_summary.read_text(encoding="utf-8").splitlines():
            match = pattern.search(line)
            if match:
                durations.append(float(match.group(1)))

        if not durations:
            return None
        return sum(durations) / len(durations)

    @staticmethod
    def _timestamp() -> str:
        """Return an ISO-like timestamp for CSV rows."""
        return datetime.now().isoformat(timespec="seconds")
