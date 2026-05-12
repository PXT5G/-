"""Desktop dashboard for managing automation tasks.

Run with:
    python main.py

Requires:
    pip install customtkinter
"""

from __future__ import annotations

from pathlib import Path

import customtkinter as ctk


class AutomationDashboard(ctk.CTk):
    """Main application window for the automation control center."""

    SIDEBAR_ITEMS = ("Home", "Credentials", "Task Manager", "Live Logs")

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x700")
        self.minsize(900, 600)

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
            self.show_placeholder_view(
                "Task Manager",
                "Create, schedule, and monitor automation tasks from this panel.",
            )
        elif selected_item == "Live Logs":
            self.show_logs_view()

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
        self.log_textbox.insert(
            "1.0",
            "[10:05:00] Automation Control Center initialized.\n"
            "[10:05:01] Waiting for task activity...\n",
        )
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
