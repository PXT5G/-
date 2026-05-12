"""Automation Control Center desktop dashboard.

This module defines a CustomTkinter application shell with a sidebar-driven
layout for managing automation tasks, credentials, task state, and live logs.
"""

from __future__ import annotations

import customtkinter as ctk


class AutomationDashboard(ctk.CTk):
    """Main application window for the automation control center."""

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x700")
        self.minsize(900, 600)

        self._configure_theme()
        self._configure_grid()
        self._build_sidebar()
        self._build_header()
        self._build_content_area()

        self.show_home_view()

    def _configure_theme(self) -> None:
        """Apply the dark blue/gray visual style used by the dashboard."""
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.colors = {
            "background": "#101720",
            "surface": "#17212f",
            "surface_light": "#1f2d3d",
            "accent": "#2f80ed",
            "accent_hover": "#1c64c7",
            "text": "#f5f7fa",
            "muted": "#9fb0c3",
            "success": "#28a745",
            "failed": "#e55353",
            "warning": "#f0ad4e",
        }

        self.configure(fg_color=self.colors["background"])

    def _configure_grid(self) -> None:
        """Configure the root window's two-column application layout."""
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=0)
        self.grid_rowconfigure(1, weight=1)

    def _build_sidebar(self) -> None:
        """Create sidebar navigation controls."""
        self.sidebar = ctk.CTkFrame(
            self,
            width=230,
            corner_radius=0,
            fg_color=self.colors["surface"],
        )
        self.sidebar.grid(row=0, column=0, rowspan=2, sticky="nsew")
        self.sidebar.grid_propagate(False)

        brand_label = ctk.CTkLabel(
            self.sidebar,
            text="Automation\nHub",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=self.colors["text"],
            justify="left",
        )
        brand_label.pack(padx=24, pady=(32, 28), anchor="w")

        self.nav_buttons: dict[str, ctk.CTkButton] = {}
        nav_items = (
            ("Home", self.show_home_view),
            ("Credentials", self.show_credentials_view),
            ("Task Manager", self.show_task_manager_view),
            ("Live Logs", self.show_logs_view),
        )

        for label, command in nav_items:
            button = ctk.CTkButton(
                self.sidebar,
                text=label,
                command=command,
                height=44,
                corner_radius=10,
                fg_color="transparent",
                hover_color=self.colors["surface_light"],
                text_color=self.colors["text"],
                anchor="w",
                font=ctk.CTkFont(size=15, weight="bold"),
            )
            button.pack(fill="x", padx=16, pady=6)
            self.nav_buttons[label] = button

        sidebar_footer = ctk.CTkLabel(
            self.sidebar,
            text="Ready for automation",
            text_color=self.colors["muted"],
            font=ctk.CTkFont(size=12),
        )
        sidebar_footer.pack(side="bottom", padx=24, pady=24, anchor="w")

    def _build_header(self) -> None:
        """Create the top header with the dashboard title."""
        self.header = ctk.CTkFrame(
            self,
            height=92,
            corner_radius=0,
            fg_color=self.colors["background"],
        )
        self.header.grid(row=0, column=1, sticky="ew")
        self.header.grid_columnconfigure(0, weight=1)
        self.header.grid_propagate(False)

        title = ctk.CTkLabel(
            self.header,
            text="Automation Control Center",
            font=ctk.CTkFont(size=30, weight="bold"),
            text_color=self.colors["text"],
        )
        title.grid(row=0, column=0, padx=32, pady=(24, 4), sticky="w")

        subtitle = ctk.CTkLabel(
            self.header,
            text="Monitor credentials, tasks, threads, and real-time activity.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted"],
        )
        subtitle.grid(row=1, column=0, padx=32, pady=(0, 18), sticky="w")

    def _build_content_area(self) -> None:
        """Create the dynamic content host used by all sidebar pages."""
        self.content_frame = ctk.CTkFrame(
            self,
            corner_radius=18,
            fg_color=self.colors["surface"],
        )
        self.content_frame.grid(row=1, column=1, padx=32, pady=(0, 32), sticky="nsew")
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(0, weight=1)

    def _clear_content(self) -> None:
        """Remove existing widgets before rendering a new page."""
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    def _set_active_nav(self, active_label: str) -> None:
        """Update sidebar button styling to show the current selection."""
        for label, button in self.nav_buttons.items():
            if label == active_label:
                button.configure(
                    fg_color=self.colors["accent"],
                    hover_color=self.colors["accent_hover"],
                )
            else:
                button.configure(
                    fg_color="transparent",
                    hover_color=self.colors["surface_light"],
                )

    def _add_page_heading(self, parent: ctk.CTkFrame, title: str, subtitle: str) -> None:
        """Add a consistent title block to a content page."""
        heading = ctk.CTkLabel(
            parent,
            text=title,
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=self.colors["text"],
        )
        heading.grid(row=0, column=0, padx=28, pady=(28, 4), sticky="w")

        description = ctk.CTkLabel(
            parent,
            text=subtitle,
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted"],
        )
        description.grid(row=1, column=0, padx=28, pady=(0, 22), sticky="w")

    def show_home_view(self) -> None:
        """Render the dashboard overview with placeholder statistic cards."""
        self._clear_content()
        self._set_active_nav("Home")

        page = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        page.grid(row=0, column=0, sticky="nsew")
        page.grid_columnconfigure((0, 1, 2), weight=1, uniform="stats")

        self._add_page_heading(
            page,
            "Home",
            "High-level automation health indicators.",
        )

        cards = (
            ("Success", "0", self.colors["success"]),
            ("Failed", "0", self.colors["failed"]),
            ("Active Threads", "0", self.colors["warning"]),
        )

        for column, (label, value, accent_color) in enumerate(cards):
            card = self._create_stat_card(page, label, value, accent_color)
            card.grid(row=2, column=column, padx=18, pady=(8, 24), sticky="nsew")

        message = ctk.CTkLabel(
            page,
            text="Select a section from the sidebar to manage your automation workflow.",
            font=ctk.CTkFont(size=16),
            text_color=self.colors["muted"],
        )
        message.grid(row=3, column=0, columnspan=3, padx=28, pady=(8, 0), sticky="w")

    def _create_stat_card(
        self,
        parent: ctk.CTkFrame,
        label: str,
        value: str,
        accent_color: str,
    ) -> ctk.CTkFrame:
        """Create a reusable metric card for the Home view."""
        card = ctk.CTkFrame(
            parent,
            height=150,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
        )
        card.grid_propagate(False)
        card.grid_columnconfigure(0, weight=1)

        accent_bar = ctk.CTkFrame(card, width=5, corner_radius=4, fg_color=accent_color)
        accent_bar.grid(row=0, column=0, rowspan=2, padx=(18, 0), pady=22, sticky="nsw")

        value_label = ctk.CTkLabel(
            card,
            text=value,
            font=ctk.CTkFont(size=36, weight="bold"),
            text_color=self.colors["text"],
        )
        value_label.grid(row=0, column=0, padx=(40, 20), pady=(28, 0), sticky="w")

        title_label = ctk.CTkLabel(
            card,
            text=label,
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=self.colors["muted"],
        )
        title_label.grid(row=1, column=0, padx=(40, 20), pady=(0, 28), sticky="w")

        return card

    def show_credentials_view(self) -> None:
        """Render a placeholder credentials page."""
        self._clear_content()
        self._set_active_nav("Credentials")
        self._render_placeholder_page(
            "Credentials",
            "Secure credential management will be configured here.",
        )

    def show_task_manager_view(self) -> None:
        """Render a placeholder task manager page."""
        self._clear_content()
        self._set_active_nav("Task Manager")
        self._render_placeholder_page(
            "Task Manager",
            "Queue, launch, and monitor automation tasks from this view.",
        )

    def show_logs_view(self) -> None:
        """Render a scrollable live logs page."""
        self._clear_content()
        self._set_active_nav("Live Logs")

        page = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        page.grid(row=0, column=0, sticky="nsew")
        page.grid_columnconfigure(0, weight=1)
        page.grid_rowconfigure(2, weight=1)

        self._add_page_heading(
            page,
            "Live Logs",
            "Real-time automation activity will stream into this panel.",
        )

        log_box = ctk.CTkTextbox(
            page,
            corner_radius=14,
            fg_color="#0b1118",
            border_width=1,
            border_color=self.colors["surface_light"],
            text_color=self.colors["text"],
            scrollbar_button_color=self.colors["accent"],
            scrollbar_button_hover_color=self.colors["accent_hover"],
            font=ctk.CTkFont(family="Courier", size=13),
            wrap="word",
        )
        log_box.grid(row=2, column=0, padx=28, pady=(0, 28), sticky="nsew")
        log_box.insert(
            "1.0",
            "[10:05:00] Automation Control Center initialized.\n"
            "[10:05:01] Waiting for task activity...\n",
        )
        log_box.configure(state="disabled")

    def _render_placeholder_page(self, title: str, subtitle: str) -> None:
        """Render a simple placeholder page for future feature areas."""
        page = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        page.grid(row=0, column=0, sticky="nsew")
        page.grid_columnconfigure(0, weight=1)

        self._add_page_heading(page, title, subtitle)

        placeholder = ctk.CTkFrame(
            page,
            corner_radius=16,
            fg_color=self.colors["surface_light"],
        )
        placeholder.grid(row=2, column=0, padx=28, pady=(8, 28), sticky="ew")

        placeholder_label = ctk.CTkLabel(
            placeholder,
            text="Coming soon",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=self.colors["text"],
        )
        placeholder_label.pack(padx=24, pady=(28, 6), anchor="w")

        placeholder_description = ctk.CTkLabel(
            placeholder,
            text="This section is ready for your next automation feature.",
            font=ctk.CTkFont(size=14),
            text_color=self.colors["muted"],
        )
        placeholder_description.pack(padx=24, pady=(0, 28), anchor="w")


if __name__ == "__main__":
    app = AutomationDashboard()
    app.mainloop()
