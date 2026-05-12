"""
Desktop shell: Settings UI including the Webhooks integration tab.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from PyQt6.QtWidgets import (
    QApplication,
    QDialog,
    QDialogButtonBox,
    QDoubleSpinBox,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from settings_store import WebhookSettings, load_settings, save_settings
from task_manager import TaskManager

logging.basicConfig(level=logging.INFO)


class SettingsDialog(QDialog):
    def __init__(self, parent: QWidget | None = None):
        super().__init__(parent)
        self.setWindowTitle("Settings")
        self.resize(720, 520)

        self._settings = load_settings()

        tabs = QTabWidget()
        tabs.addTab(self._build_webhooks_tab(), "Webhooks")

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Close
        )
        buttons.accepted.connect(self._on_save)
        buttons.rejected.connect(self.reject)

        root = QVBoxLayout(self)
        root.addWidget(tabs)
        root.addWidget(buttons)

    def _build_webhooks_tab(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)

        info = QLabel(
            "Cross-System Research Integration: when a Resource Error (SMS / Captcha / similar) "
            "is detected, the automation POSTs this JSON template to your Target URL. "
            "Use placeholders like {{message}}, {{task_id}}, and {{error_type}}."
        )
        info.setWordWrap(True)
        layout.addWidget(info)

        form = QFormLayout()
        self._url = QLineEdit(self._settings.webhooks.target_url)
        self._url.setPlaceholderText("https://example.com/hooks/resource-error")
        form.addRow("Target URL", self._url)

        self._timeout = QDoubleSpinBox()
        self._timeout.setRange(1.0, 3600.0)
        self._timeout.setDecimals(1)
        self._timeout.setValue(float(self._settings.webhooks.request_timeout_seconds or 120.0))
        form.addRow("Request timeout (seconds)", self._timeout)

        layout.addLayout(form)

        layout.addWidget(QLabel("JSON template"))
        self._payload = QTextEdit(self._settings.webhooks.payload_template)
        self._payload.setPlaceholderText('{ "event": "resource_error", "message": {{message}} }')
        self._payload.setAcceptRichText(False)
        layout.addWidget(self._payload, stretch=1)
        return w

    def _on_save(self) -> None:
        self._settings.webhooks = WebhookSettings(
            target_url=self._url.text().strip(),
            payload_template=self._payload.toPlainText(),
            request_timeout_seconds=float(self._timeout.value()),
        )
        try:
            save_settings(self._settings)
        except OSError as e:
            QMessageBox.critical(self, "Save failed", str(e))
            return
        QMessageBox.information(self, "Saved", "Webhook settings saved.")
        self.accept()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Automation System")
        self.resize(520, 200)

        self._task_manager = TaskManager()

        central = QWidget()
        self.setCentralWidget(central)
        v = QVBoxLayout(central)

        v.addWidget(QLabel("Open Settings to configure the Universal Webhook integration."))

        row = QHBoxLayout()
        btn_settings = QPushButton("Settings…")
        btn_settings.clicked.connect(self._open_settings)
        row.addWidget(btn_settings)

        btn_sim = QPushButton("Simulate Resource Error (demo)")
        btn_sim.clicked.connect(self._simulate_resource_error)
        row.addWidget(btn_sim)
        row.addStretch(1)
        v.addLayout(row)

    def _open_settings(self) -> None:
        dlg = SettingsDialog(self)
        dlg.exec()
        self._task_manager.reload_settings()

    def _simulate_resource_error(self) -> None:
        self._task_manager.reload_settings()
        self._task_manager.on_error_message(
            "Captcha required before continuing",
            task_id="demo-task",
            error_type="captcha",
        )


def main() -> int:
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
