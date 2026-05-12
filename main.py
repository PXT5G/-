"""
Desktop shell for automation settings, including the Webhooks integration tab.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QSpinBox,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from settings_store import IntegrationSettings, SettingsStore


class SettingsDialog(QDialog):
    def __init__(self, store: SettingsStore, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.store = store
        self.setWindowTitle("Settings")
        self.resize(640, 520)

        tabs = QTabWidget()
        tabs.addTab(self._build_general_tab(), "General")
        tabs.addTab(self._build_webhooks_tab(), "Webhooks")

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self._on_save)
        buttons.rejected.connect(self.reject)

        layout = QVBoxLayout()
        layout.addWidget(tabs)
        layout.addWidget(buttons)
        self.setLayout(layout)

        self._load_from_store()

    def _build_general_tab(self) -> QWidget:
        page = QWidget()
        v = QVBoxLayout()
        v.addWidget(QLabel("Configure integration defaults under the Webhooks tab."))
        v.addStretch(1)
        page.setLayout(v)
        return page

    def _build_webhooks_tab(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout()

        info = QLabel(
            "Cross-system research integration: when a resource error (SMS, CAPTCHA, OTP, …) "
            "is detected, the runtime POSTs the JSON template to your target URL and waits for a response. "
            "If the JSON body includes a top-level 'code' or 'token' field, it is typed into the focused "
            "browser field using human-like keystroke delays."
        )
        info.setWordWrap(True)
        outer.addWidget(info)

        self.webhook_enabled = QCheckBox("Enable universal webhook on resource errors")

        url_row = QHBoxLayout()
        url_row.addWidget(QLabel("Target URL"))
        self.webhook_url = QLineEdit()
        self.webhook_url.setPlaceholderText("https://example.com/hooks/resource-error")
        url_row.addWidget(self.webhook_url, stretch=1)

        timeout_row = QHBoxLayout()
        timeout_row.addWidget(QLabel("HTTP timeout (seconds)"))
        self.webhook_timeout = QSpinBox()
        self.webhook_timeout.setRange(5, 600)
        self.webhook_timeout.setSingleStep(5)
        timeout_row.addWidget(self.webhook_timeout)
        timeout_row.addStretch(1)

        template_group = QGroupBox("JSON template (string.Template placeholders: $message, $category, $task_id, …)")
        template_layout = QVBoxLayout()
        self.webhook_template = QTextEdit()
        self.webhook_template.setAcceptRichText(False)
        self.webhook_template.setPlaceholderText(
            '{"event": "resource_error", "category": "$category", "message": "$message", "task_id": "$task_id"}'
        )
        template_layout.addWidget(self.webhook_template)
        template_group.setLayout(template_layout)

        outer.addWidget(self.webhook_enabled)
        outer.addLayout(url_row)
        outer.addLayout(timeout_row)
        outer.addWidget(template_group)
        outer.addStretch(1)
        page.setLayout(outer)
        return page

    def _load_from_store(self) -> None:
        cfg: IntegrationSettings = self.store.integration
        self.webhook_enabled.setChecked(cfg.webhook_enabled)
        self.webhook_url.setText(cfg.webhook_url)
        self.webhook_timeout.setValue(int(max(5, min(600, round(cfg.webhook_timeout_seconds)))))
        self.webhook_template.setPlainText(cfg.webhook_payload_template)

    def _on_save(self) -> None:
        template = self.webhook_template.toPlainText().strip()
        if self.webhook_enabled.isChecked():
            if not self.webhook_url.text().strip():
                QMessageBox.warning(self, "Webhooks", "Please enter a target URL or disable webhooks.")
                return
            if not template:
                QMessageBox.warning(self, "Webhooks", "Please provide a JSON template.")
                return

        self.store.integration.webhook_enabled = self.webhook_enabled.isChecked()
        self.store.integration.webhook_url = self.webhook_url.text().strip()
        self.store.integration.webhook_timeout_seconds = float(self.webhook_timeout.value())
        self.store.integration.webhook_payload_template = template or self.store.integration.webhook_payload_template
        try:
            self.store.save()
        except OSError as exc:
            QMessageBox.critical(self, "Settings", f"Could not save settings: {exc}")
            return
        self.accept()


class MainWindow(QMainWindow):
    def __init__(self, store: SettingsStore) -> None:
        super().__init__()
        self.store = store
        self.setWindowTitle("Automation Control")
        self._build_ui()

    def _build_ui(self) -> None:
        central = QWidget()
        layout = QVBoxLayout()
        title = QLabel("Universal Integration Layer")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        open_settings = QPushButton("Open Settings…")
        open_settings.clicked.connect(self._open_settings)
        layout.addWidget(title)
        layout.addWidget(open_settings)
        layout.addStretch(1)
        central.setLayout(layout)
        self.setCentralWidget(central)

    def _open_settings(self) -> None:
        self.store.load()
        dialog = SettingsDialog(self.store, self)
        dialog.exec()


def main() -> int:
    store = SettingsStore(Path(__file__).resolve().parent / "settings.json")
    store.load()

    app = QApplication(sys.argv)
    window = MainWindow(store)
    window.resize(520, 320)
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
