"""Desktop dashboard for managing automation tasks.

Run with:
    python main.py

Requires:
    pip install -r requirements.txt
    python -m playwright install chromium
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import threading

import customtkinter as ctk

from api_handler import CapSolverClient, ConfigManager, FiveSimClient, IntegrationError
from browser_engine import BrowserEngine
from task_manager import AutomatedTestScenario, ScenarioConfig


class AutomationDashboard(ctk.CTk):
    """Main application window for the automation control center."""

    SIDEBAR_ITEMS = ("Home", "Credentials", "Task Manager", "Live Logs", "Settings")

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x700")
        self.minsize(900, 600)
        self.browser_engine = BrowserEngine()
        self.config_manager = ConfigManager()
        self.config_load_error: str | None = None
        try:
            self.service_config = self.config_manager.load()
        except IntegrationError as exc:
            self.service_config = ConfigManager.default_config()
            self.config_load_error = str(exc)
        self.log_entries = [
            "[10:05:00] Automation Control Center initialized.",
            "[10:05:01] Waiting for task activity...",
        ]
        if self.config_load_error:
            self.log_entries.append(
                f"[10:05:02] Settings load warning: {self.config_load_error}"
            )
        self.protocol("WM_DELETE_WINDOW", self._on_close)

        self._configure_theme()
        self._configure_grid()
        self._create_sidebar()
        self._create_header()
        self._create_content_area()

        self.show_home_view()

    def _configure_theme(self) -> None:
        """Apply the application's dark blue/gray visual style."""
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.colors = {
            "background": "#111827",
            "surface": "#1F2937",
            "surface_light": "#273449",
            "accent": "#2563EB",
            "accent_hover": "#1D4ED8",
            "text": "#F9FAFB",
            "muted_text": "#9CA3AF",
            "border": "#374151",
        }

        self.configure(fg_color=self.colors["background"])

    def _configure_grid(self) -> None:
        """Create a two-column shell with a fixed sidebar and fluid content."""
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=0)
        self.grid_rowconfigure(1, weight=1)

    def _create_sidebar(self) -> None:
        """Build the navigation sidebar."""
        self.sidebar = ctk.CTkFrame(
            self,
            width=230,
            corner_radius=0,
            fg_color=self.colors["surface"],
        )
        self.sidebar.grid(row=0, column=0, rowspan=2, sticky="nsew")
        self.sidebar.grid_propagate(False)
        self.sidebar.grid_rowconfigure(len(self.SIDEBAR_ITEMS) + 1, weight=1)

        brand_label = ctk.CTkLabel(
            self.sidebar,
            text="AUTOMATION",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=self.colors["text"],
        )
        brand_label.grid(row=0, column=0, padx=24, pady=(28, 24), sticky="w")

        self.navigation_buttons: dict[str, ctk.CTkButton] = {}
        for index, item in enumerate(self.SIDEBAR_ITEMS, start=1):
            button = ctk.CTkButton(
                self.sidebar,
                text=item,
                height=44,
                corner_radius=10,
                fg_color="transparent",
                hover_color=self.colors["surface_light"],
                anchor="w",
                font=ctk.CTkFont(size=14, weight="bold"),
                command=lambda selected=item: self._handle_navigation(selected),
            )
            button.grid(row=index, column=0, padx=18, pady=6, sticky="ew")
            self.navigation_buttons[item] = button

    def _create_header(self) -> None:
        """Create the top application header."""
        self.header = ctk.CTkFrame(
            self,
            height=90,
            corner_radius=0,
            fg_color=self.colors["background"],
        )
        self.header.grid(row=0, column=1, sticky="ew", padx=28, pady=(24, 0))
        self.header.grid_columnconfigure(0, weight=1)
        self.header.grid_propagate(False)

        title_label = ctk.CTkLabel(
            self.header,
            text="Automation Control Center",
            font=ctk.CTkFont(size=30, weight="bold"),
            text_color=self.colors["text"],
        )
        title_label.grid(row=0, column=0, sticky="w")

        subtitle_label = ctk.CTkLabel(
            self.header,
            text="Monitor automation health, credentials, tasks, and live activity.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted_text"],
        )
        subtitle_label.grid(row=1, column=0, sticky="w", pady=(6, 0))

    def _create_content_area(self) -> None:
        """Create the dynamic main content frame."""
        self.content_frame = ctk.CTkFrame(
            self,
            corner_radius=18,
            fg_color=self.colors["surface"],
            border_width=1,
            border_color=self.colors["border"],
        )
        self.content_frame.grid(row=1, column=1, sticky="nsew", padx=28, pady=28)
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(0, weight=1)

    def _handle_navigation(self, selected_item: str) -> None:
        """Route sidebar selections to the appropriate view."""
        if selected_item == "Home":
            self.show_home_view()
        elif selected_item == "Credentials":
            self.show_credentials_view()
        elif selected_item == "Task Manager":
            self.show_task_manager_view()
        elif selected_item == "Live Logs":
            self.show_logs_view()
        elif selected_item == "Settings":
            self.show_settings_view()

    def _set_active_navigation(self, active_item: str) -> None:
        """Highlight the active sidebar button."""
        for item, button in self.navigation_buttons.items():
            is_active = item == active_item
            button.configure(
                fg_color=self.colors["accent"] if is_active else "transparent",
                hover_color=self.colors["accent_hover"]
                if is_active
                else self.colors["surface_light"],
            )

    def _clear_content(self) -> None:
        """Remove existing widgets before rendering a new content view."""
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def show_home_view(self) -> None:
        """Render the dashboard overview with placeholder stats."""
        self._set_active_navigation("Home")
        self._clear_content()

        home_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        home_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        home_frame.grid_columnconfigure((0, 1, 2), weight=1, uniform="stats")
        home_frame.grid_rowconfigure(1, weight=1)

        heading = ctk.CTkLabel(
            home_frame,
            text="Dashboard Overview",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 22))

        stats = [
            ("Success", "0", "Completed automations"),
            ("Failed", "0", "Needs review"),
            ("Active Threads", "0", "Currently running"),
        ]

        for column, (title, value, description) in enumerate(stats):
            card = self._create_stat_card(home_frame, title, value, description)
            card.grid(row=1, column=column, padx=8, pady=8, sticky="nsew")

    def _create_stat_card(
        self,
        parent: ctk.CTkFrame,
        title: str,
        value: str,
        description: str,
    ) -> ctk.CTkFrame:
        """Create a reusable statistic card for the home view."""
        card = ctk.CTkFrame(
            parent,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
            border_width=1,
            border_color=self.colors["border"],
        )
        card.grid_columnconfigure(0, weight=1)

        title_label = ctk.CTkLabel(
            card,
            text=title,
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=self.colors["muted_text"],
        )
        title_label.grid(row=0, column=0, padx=22, pady=(22, 8), sticky="w")

        value_label = ctk.CTkLabel(
            card,
            text=value,
            font=ctk.CTkFont(size=42, weight="bold"),
            text_color=self.colors["text"],
        )
        value_label.grid(row=1, column=0, padx=22, sticky="w")

        description_label = ctk.CTkLabel(
            card,
            text=description,
            font=ctk.CTkFont(size=13),
            text_color=self.colors["muted_text"],
        )
        description_label.grid(row=2, column=0, padx=22, pady=(6, 22), sticky="w")

        return card

    def show_credentials_view(self) -> None:
        """Render text inputs for cards and account credentials."""
        self._set_active_navigation("Credentials")
        self._clear_content()

        credentials_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        credentials_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        credentials_frame.grid_columnconfigure((0, 1), weight=1, uniform="inputs")
        credentials_frame.grid_rowconfigure(1, weight=1)

        heading = ctk.CTkLabel(
            credentials_frame,
            text="Credentials",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 18))

        card_input_frame, self.card_list_textbox = self._create_credentials_input(
            credentials_frame,
            title="Card List",
            hint="Format: Number|Month|Year|CVV",
        )
        card_input_frame.grid(row=1, column=0, padx=(0, 10), sticky="nsew")

        account_input_frame, self.account_list_textbox = self._create_credentials_input(
            credentials_frame,
            title="Account List",
            hint="Paste accounts or credentials here",
        )
        account_input_frame.grid(row=1, column=1, padx=(10, 0), sticky="nsew")

        actions_frame = ctk.CTkFrame(credentials_frame, fg_color="transparent")
        actions_frame.grid(row=2, column=0, columnspan=2, sticky="ew", pady=(18, 0))
        actions_frame.grid_columnconfigure(1, weight=1)

        save_button = ctk.CTkButton(
            actions_frame,
            text="Save Credentials",
            height=42,
            corner_radius=10,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._save_credentials,
        )
        save_button.grid(row=0, column=0, sticky="w")

        self.credentials_status_label = ctk.CTkLabel(
            actions_frame,
            text="",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#60A5FA",
        )
        self.credentials_status_label.grid(row=0, column=1, padx=(16, 0), sticky="w")

    def _create_credentials_input(
        self,
        parent: ctk.CTkFrame,
        title: str,
        hint: str,
    ) -> tuple[ctk.CTkFrame, ctk.CTkTextbox]:
        """Create a labeled, large text input area for credential data."""
        input_frame = ctk.CTkFrame(
            parent,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
            border_width=1,
            border_color=self.colors["border"],
        )
        input_frame.grid_columnconfigure(0, weight=1)
        input_frame.grid_rowconfigure(2, weight=1)

        title_label = ctk.CTkLabel(
            input_frame,
            text=title,
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=self.colors["text"],
        )
        title_label.grid(row=0, column=0, padx=18, pady=(18, 4), sticky="w")

        hint_label = ctk.CTkLabel(
            input_frame,
            text=hint,
            font=ctk.CTkFont(size=12),
            text_color=self.colors["muted_text"],
        )
        hint_label.grid(row=1, column=0, padx=18, pady=(0, 10), sticky="w")

        textbox = ctk.CTkTextbox(
            input_frame,
            corner_radius=12,
            fg_color="#0B1220",
            border_width=1,
            border_color=self.colors["border"],
            text_color=self.colors["text"],
            font=ctk.CTkFont(family="Consolas", size=13),
            wrap="none",
        )
        textbox.grid(row=2, column=0, padx=18, pady=(0, 18), sticky="nsew")

        return input_frame, textbox

    def _save_credentials(self) -> None:
        """Persist credential text areas into local text files."""
        cards = self.card_list_textbox.get("1.0", "end-1c")
        accounts = self.account_list_textbox.get("1.0", "end-1c")

        Path("cards.txt").write_text(cards, encoding="utf-8")
        Path("accounts.txt").write_text(accounts, encoding="utf-8")

        self.credentials_status_label.configure(text="تم حفظ البيانات بنجاح!")

    def show_task_manager_view(self) -> None:
        """Render task controls for starting the browser automation engine."""
        self._set_active_navigation("Task Manager")
        self._clear_content()

        task_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        task_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        task_frame.grid_columnconfigure(0, weight=1)
        task_frame.grid_rowconfigure(1, weight=1)

        heading = ctk.CTkLabel(
            task_frame,
            text="Task Manager",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, sticky="w", pady=(0, 18))

        control_card = ctk.CTkFrame(
            task_frame,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
            border_width=1,
            border_color=self.colors["border"],
        )
        control_card.grid(row=1, column=0, sticky="nsew")
        control_card.grid_columnconfigure(0, weight=1)

        title_label = ctk.CTkLabel(
            control_card,
            text="Browser Engine",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=self.colors["text"],
        )
        title_label.grid(row=0, column=0, padx=24, pady=(24, 8), sticky="w")

        description_label = ctk.CTkLabel(
            control_card,
            text="Run a safe E2E scenario against an authorized staging or sandbox URL.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted_text"],
        )
        description_label.grid(row=1, column=0, padx=24, pady=(0, 22), sticky="w")

        url_label = ctk.CTkLabel(
            control_card,
            text="Target Test URL",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=self.colors["text"],
        )
        url_label.grid(row=2, column=0, padx=24, pady=(0, 6), sticky="w")

        self.test_url_entry = ctk.CTkEntry(
            control_card,
            height=42,
            corner_radius=10,
            fg_color="#0B1220",
            border_color=self.colors["border"],
            text_color=self.colors["text"],
        )
        self.test_url_entry.grid(row=3, column=0, padx=24, pady=(0, 18), sticky="ew")
        self.test_url_entry.insert(0, "https://example.com")

        self.start_button = ctk.CTkButton(
            control_card,
            text="Start E2E Test",
            height=44,
            width=170,
            corner_radius=10,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._start_browser_engine,
        )
        self.start_button.grid(row=4, column=0, padx=24, pady=(0, 24), sticky="w")

    def _start_browser_engine(self) -> None:
        """Start the E2E scenario without blocking the UI event loop."""
        self.start_button.configure(state="disabled", text="Running...")
        self.current_test_url = self.test_url_entry.get().strip()
        self._append_log("Initializing E2E Test Scenario...")

        thread = threading.Thread(target=self._launch_browser_engine, daemon=True)
        thread.start()

    def _launch_browser_engine(self) -> None:
        """Run the E2E scenario in a background thread and report UI status."""
        try:
            scenario = AutomatedTestScenario(
                browser_engine=self.browser_engine,
                config=ScenarioConfig(
                    target_url=self.current_test_url,
                    five_sim_api_key=self.service_config.get("five_sim_api_key", ""),
                    capsolver_api_key=self.service_config.get("capsolver_api_key", ""),
                ),
                log_callback=self._append_log_from_worker,
            )
            scenario.run()
        except Exception as exc:
            self.after(0, self._handle_browser_start_failure, str(exc))
            return

        self.after(0, self._handle_browser_start_success)

    def _handle_browser_start_success(self) -> None:
        """Update the UI after a successful E2E scenario run."""
        self._append_log("E2E Test Scenario Finished Successfully.")
        if hasattr(self, "start_button"):
            self.start_button.configure(state="normal", text="Start E2E Test")

    def _handle_browser_start_failure(self, error_message: str) -> None:
        """Update the UI after a failed E2E scenario run."""
        self._append_log(f"E2E Test Scenario Failed: {error_message}")
        if hasattr(self, "start_button"):
            self.start_button.configure(state="normal", text="Start E2E Test")

    def show_settings_view(self) -> None:
        """Render service API key settings."""
        self._set_active_navigation("Settings")
        self._clear_content()

        settings_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        settings_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        settings_frame.grid_columnconfigure(0, weight=1)

        heading = ctk.CTkLabel(
            settings_frame,
            text="Settings",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, sticky="w", pady=(0, 18))

        settings_card = ctk.CTkFrame(
            settings_frame,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
            border_width=1,
            border_color=self.colors["border"],
        )
        settings_card.grid(row=1, column=0, sticky="ew")
        settings_card.grid_columnconfigure(0, weight=1)

        intro_label = ctk.CTkLabel(
            settings_card,
            text="Store provider API keys locally for integration health checks.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted_text"],
        )
        intro_label.grid(row=0, column=0, padx=22, pady=(22, 14), sticky="w")

        self.five_sim_key_entry = self._create_settings_entry(
            settings_card,
            row=1,
            label="5sim API Key",
            value=self.service_config.get("five_sim_api_key", ""),
        )
        self.capsolver_key_entry = self._create_settings_entry(
            settings_card,
            row=2,
            label="CapSolver API Key",
            value=self.service_config.get("capsolver_api_key", ""),
        )

        actions_frame = ctk.CTkFrame(settings_card, fg_color="transparent")
        actions_frame.grid(row=3, column=0, padx=22, pady=(8, 22), sticky="ew")
        actions_frame.grid_columnconfigure(2, weight=1)

        save_button = ctk.CTkButton(
            actions_frame,
            text="Save Keys",
            height=42,
            corner_radius=10,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._save_service_settings,
        )
        save_button.grid(row=0, column=0, padx=(0, 10), sticky="w")

        self.check_apis_button = ctk.CTkButton(
            actions_frame,
            text="Check APIs",
            height=42,
            corner_radius=10,
            fg_color=self.colors["surface"],
            hover_color=self.colors["border"],
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._check_service_apis,
        )
        self.check_apis_button.grid(row=0, column=1, sticky="w")

        self.settings_status_label = ctk.CTkLabel(
            actions_frame,
            text="",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#60A5FA",
        )
        self.settings_status_label.grid(row=0, column=2, padx=(16, 0), sticky="w")

    def _create_settings_entry(
        self,
        parent: ctk.CTkFrame,
        row: int,
        label: str,
        value: str,
    ) -> ctk.CTkEntry:
        """Create one masked API-key entry row."""
        field_frame = ctk.CTkFrame(parent, fg_color="transparent")
        field_frame.grid(row=row, column=0, padx=22, pady=(0, 14), sticky="ew")
        field_frame.grid_columnconfigure(0, weight=1)

        label_widget = ctk.CTkLabel(
            field_frame,
            text=label,
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=self.colors["text"],
        )
        label_widget.grid(row=0, column=0, sticky="w", pady=(0, 6))

        entry = ctk.CTkEntry(
            field_frame,
            height=42,
            corner_radius=10,
            fg_color="#0B1220",
            border_color=self.colors["border"],
            text_color=self.colors["text"],
            show="*",
        )
        entry.grid(row=1, column=0, sticky="ew")
        if value:
            entry.insert(0, value)
        return entry

    def _save_service_settings(self) -> None:
        """Save provider API keys to local config."""
        five_sim_key = self.five_sim_key_entry.get().strip()
        capsolver_key = self.capsolver_key_entry.get().strip()

        try:
            self.config_manager.save(five_sim_key, capsolver_key)
        except OSError as exc:
            message = f"Failed to save API settings: {exc}"
            self.settings_status_label.configure(text="فشل حفظ المفاتيح.")
            self._append_log(message)
            return

        self.service_config = {
            "five_sim_api_key": five_sim_key,
            "capsolver_api_key": capsolver_key,
        }
        self.settings_status_label.configure(text="تم حفظ مفاتيح API بنجاح.")
        self._append_log("Service API keys saved to config.json.")

    def _check_service_apis(self) -> None:
        """Check provider API keys without blocking the UI."""
        five_sim_key = self.five_sim_key_entry.get().strip()
        capsolver_key = self.capsolver_key_entry.get().strip()

        self.check_apis_button.configure(state="disabled", text="Checking...")
        self.settings_status_label.configure(text="جاري فحص الاتصالات...")
        self._append_log("Checking service API connections...")

        thread = threading.Thread(
            target=self._run_service_api_checks,
            args=(five_sim_key, capsolver_key),
            daemon=True,
        )
        thread.start()

    def _run_service_api_checks(self, five_sim_key: str, capsolver_key: str) -> None:
        """Run provider checks in the background."""
        messages: list[str] = []

        if five_sim_key:
            try:
                result = FiveSimClient(five_sim_key).check_balance()
                balance = result.get("balance", "unknown")
                currency = result.get("currency", "")
                messages.append(f"5sim balance check succeeded: {balance} {currency}")
            except IntegrationError as exc:
                messages.append(f"5sim balance check failed: {exc}")
        else:
            messages.append("5sim API key not provided; skipping balance check.")

        if capsolver_key:
            try:
                result = CapSolverClient(capsolver_key).check_balance()
                balance = result.get("balance", "unknown")
                messages.append(f"CapSolver balance check succeeded: {balance}")
            except IntegrationError as exc:
                messages.append(f"CapSolver balance check failed: {exc}")
        else:
            messages.append("CapSolver API key not provided; skipping balance check.")

        self.after(0, self._finish_service_api_checks, messages)

    def _finish_service_api_checks(self, messages: list[str]) -> None:
        """Display provider check results in the UI and logs."""
        for message in messages:
            self._append_log(message)

        if hasattr(self, "settings_status_label"):
            self.settings_status_label.configure(text="انتهى فحص الاتصالات.")
        if hasattr(self, "check_apis_button"):
            self.check_apis_button.configure(state="normal", text="Check APIs")

    def _append_log(self, message: str) -> None:
        """Append a message to the in-memory log and visible log textbox."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        self.log_entries.append(entry)

        if hasattr(self, "log_textbox") and self.log_textbox.winfo_exists():
            self.log_textbox.configure(state="normal")
            self.log_textbox.insert("end", f"{entry}\n")
            self.log_textbox.see("end")
            self.log_textbox.configure(state="disabled")

    def _append_log_from_worker(self, message: str) -> None:
        """Safely append logs generated by a background worker thread."""
        self.after(0, self._append_log, message)

    def _on_close(self) -> None:
        """Close browser resources before shutting down the application."""
        try:
            self.browser_engine.stop()
        finally:
            self.destroy()

    def show_logs_view(self) -> None:
        """Render a scrollable log area for real-time activity output."""
        self._set_active_navigation("Live Logs")
        self._clear_content()

        logs_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        logs_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        logs_frame.grid_columnconfigure(0, weight=1)
        logs_frame.grid_rowconfigure(1, weight=1)

        heading = ctk.CTkLabel(
            logs_frame,
            text="Live Logs",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, sticky="w", pady=(0, 18))

        self.log_textbox = ctk.CTkTextbox(
            logs_frame,
            corner_radius=14,
            fg_color="#0B1220",
            border_width=1,
            border_color=self.colors["border"],
            text_color=self.colors["text"],
            font=ctk.CTkFont(family="Consolas", size=13),
            wrap="word",
        )
        self.log_textbox.grid(row=1, column=0, sticky="nsew")
        self.log_textbox.insert("1.0", "\n".join(self.log_entries) + "\n")
        self.log_textbox.configure(state="disabled")

    def show_placeholder_view(self, title: str, message: str) -> None:
        """Render a simple placeholder for sections planned for future work."""
        self._set_active_navigation(title)
        self._clear_content()

        placeholder_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        placeholder_frame.grid(row=0, column=0, sticky="nsew", padx=28, pady=28)
        placeholder_frame.grid_columnconfigure(0, weight=1)
        placeholder_frame.grid_rowconfigure(0, weight=1)

        card = ctk.CTkFrame(
            placeholder_frame,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
            border_width=1,
            border_color=self.colors["border"],
        )
        card.grid(row=0, column=0, sticky="nsew")
        card.grid_columnconfigure(0, weight=1)
        card.grid_rowconfigure((0, 1), weight=1)

        title_label = ctk.CTkLabel(
            card,
            text=title,
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.colors["text"],
        )
        title_label.grid(row=0, column=0, pady=(90, 8), sticky="s")

        message_label = ctk.CTkLabel(
            card,
            text=message,
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted_text"],
        )
        message_label.grid(row=1, column=0, pady=(8, 90), sticky="n")


if __name__ == "__main__":
    app = AutomationDashboard()
    app.mainloop()
