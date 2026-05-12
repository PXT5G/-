#!/usr/bin/env python3
"""
Desktop shell for automation settings (Webhooks / Cross-System Research Integration).
"""

from __future__ import annotations

import json
import logging
import tkinter as tk
from tkinter import messagebox, ttk

from app_settings import WebhookSettings, load_settings, save_settings

logging.basicConfig(level=logging.INFO)


class SettingsApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Automation — Settings")
        self.geometry("720x520")
        self.settings = load_settings()

        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        self._general_tab = ttk.Frame(notebook)
        notebook.add(self._general_tab, text="General")
        self._build_general_tab()

        self._webhooks_tab = ttk.Frame(notebook)
        notebook.add(self._webhooks_tab, text="Webhooks")
        self._build_webhooks_tab()

        footer = ttk.Frame(self)
        footer.pack(fill=tk.X, padx=8, pady=(0, 8))
        ttk.Button(footer, text="Save all settings", command=self._on_save).pack(side=tk.RIGHT)

    def _build_general_tab(self) -> None:
        ttk.Label(
            self._general_tab,
            text="Cross-system hooks are configured under the Webhooks tab.",
            wraplength=640,
        ).pack(anchor=tk.W, padx=12, pady=12)

    def _build_webhooks_tab(self) -> None:
        wh = self.settings.webhooks
        pad = {"padx": 8, "pady": 4}

        self.webhook_enabled = tk.BooleanVar(value=wh.enabled)
        ttk.Checkbutton(
            self._webhooks_tab,
            text="Notify external API on resource errors (SMS / Captcha / verification)",
            variable=self.webhook_enabled,
        ).pack(anchor=tk.W, **pad)

        ttk.Label(self._webhooks_tab, text="Target URL").pack(anchor=tk.W, **pad)
        self.webhook_url = tk.StringVar(value=wh.target_url)
        ttk.Entry(self._webhooks_tab, textvariable=self.webhook_url, width=90).pack(fill=tk.X, **pad)

        ttk.Label(
            self._webhooks_tab,
            text="JSON template (use {{message}}, {{error_type}}, plus any keys you pass from automation).",
            wraplength=680,
        ).pack(anchor=tk.W, **pad)

        frame = ttk.Frame(self._webhooks_tab)
        frame.pack(fill=tk.BOTH, expand=True, **pad)
        self.webhook_template = tk.Text(frame, height=14, wrap=tk.WORD)
        self.webhook_template.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scroll = ttk.Scrollbar(frame, command=self.webhook_template.yview)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.webhook_template.configure(yscrollcommand=scroll.set)
        self.webhook_template.insert("1.0", wh.json_template)

        row = ttk.Frame(self._webhooks_tab)
        row.pack(fill=tk.X, **pad)
        ttk.Label(row, text="Response wait timeout (seconds)").pack(side=tk.LEFT)
        self.webhook_timeout = tk.StringVar(value=str(wh.timeout_seconds))
        ttk.Entry(row, textvariable=self.webhook_timeout, width=10).pack(side=tk.LEFT, padx=(8, 0))

    def _on_save(self) -> None:
        try:
            timeout = float(self.webhook_timeout.get().strip())
        except ValueError:
            messagebox.showerror("Invalid value", "Timeout must be a number.")
            return

        template = self.webhook_template.get("1.0", tk.END).strip()
        try:
            parsed = json.loads(template)
            if not isinstance(parsed, dict):
                raise ValueError("Root must be a JSON object.")
        except (json.JSONDecodeError, ValueError) as exc:
            messagebox.showerror("Invalid JSON", f"Template must be valid JSON object:\n{exc}")
            return

        self.settings.webhooks = WebhookSettings(
            enabled=bool(self.webhook_enabled.get()),
            target_url=self.webhook_url.get().strip(),
            json_template=template,
            timeout_seconds=timeout,
        )
        save_settings(self.settings)
        messagebox.showinfo("Saved", "Settings were written to user_settings.json.")


def main() -> None:
    app = SettingsApp()
    app.mainloop()


if __name__ == "__main__":
    main()
