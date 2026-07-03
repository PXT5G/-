"""Desktop shell: PyQt6 settings UI for universal webhook integration.

Optional entry point — the primary automation UI is main.py (CustomTkinter).
Run with: python webhook_settings_gui.py
"""

from __future__ import annotations

import sys

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QDoubleSpinBox,
    QFormLayout,
    QGroupBox,
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

from resource_webhook import update_webhook_settings
from settings_store import WebhookIntegrationSettings, load_settings


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Automation — Webhook Settings")
        self.resize(720, 520)

        root = QWidget()
        self.setCentralWidget(root)
        layout = QVBoxLayout(root)

        tabs = QTabWidget()
        layout.addWidget(tabs)

        tabs.addTab(self._build_general_tab(), "General")
        tabs.addTab(self._build_webhooks_tab(), "Webhooks")

    def _build_general_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        v.addWidget(
            QLabel(
                "Configure webhook integration under the <b>Webhooks</b> tab "
                "for cross-system research (external APIs, relays, solvers)."
            )
        )
        v.addStretch(1)
        return w

    def _build_webhooks_tab(self) -> QWidget:
        w = QWidget()
        outer = QVBoxLayout(w)

        info = QLabel(
            "On resource errors (SMS, captcha, OTP, MFA), the system POSTs your JSON template "
            "to the target URL and waits for a response. If the JSON body includes "
            "<code>code</code> or <code>token</code>, that value is typed into the active browser."
        )
        info.setWordWrap(True)
        info.setTextFormat(Qt.TextFormat.RichText)
        outer.addWidget(info)

        box = QGroupBox("Universal webhook")
        form = QFormLayout(box)

        self._wh_enabled = QCheckBox("Enable webhook on resource errors")
        form.addRow(self._wh_enabled)

        self._wh_url = QLineEdit()
        self._wh_url.setPlaceholderText("https://your-relay.example/hooks/resource-error")
        form.addRow("Target URL", self._wh_url)

        self._wh_template = QTextEdit()
        self._wh_template.setPlaceholderText(
            '{"event":"resource_error","type":"{error_type}","message":"{error_message}",'
            '"task_id":"{task_id}","timestamp":"{timestamp}"}'
        )
        self._wh_template.setMinimumHeight(160)
        form.addRow("JSON template", self._wh_template)

        self._wh_timeout = QDoubleSpinBox()
        self._wh_timeout.setRange(5.0, 3600.0)
        self._wh_timeout.setSuffix(" s")
        self._wh_timeout.setDecimals(0)
        form.addRow("Response wait (timeout)", self._wh_timeout)

        outer.addWidget(box)

        btn_row = QHBoxLayout()
        save_btn = QPushButton("Save webhooks")
        save_btn.clicked.connect(self._save_webhooks)
        btn_row.addStretch(1)
        btn_row.addWidget(save_btn)
        outer.addLayout(btn_row)
        outer.addStretch(1)

        self._load_webhooks_into_form()
        return w

    def _load_webhooks_into_form(self) -> None:
        s = load_settings()
        wh = s.webhook
        self._wh_enabled.setChecked(wh.enabled)
        self._wh_url.setText(wh.target_url)
        self._wh_template.setPlainText(wh.json_template)
        self._wh_timeout.setValue(float(wh.response_timeout_sec))

    def _save_webhooks(self) -> None:
        wh = WebhookIntegrationSettings(
            enabled=self._wh_enabled.isChecked(),
            target_url=self._wh_url.text().strip(),
            json_template=self._wh_template.toPlainText(),
            response_timeout_sec=float(self._wh_timeout.value()),
        )
        try:
            update_webhook_settings(wh)
        except OSError as exc:
            QMessageBox.critical(self, "Save failed", str(exc))
            return
        QMessageBox.information(self, "Saved", "Webhook settings were written to disk.")


def main() -> int:
    app = QApplication(sys.argv)
    win = MainWindow()
    win.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
