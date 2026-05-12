"""
Automation Control Center — desktop dashboard shell built with CustomTkinter.

This module provides the main window, sidebar navigation, and placeholder
views for home stats, credentials, task manager, and live logs.
"""

from __future__ import annotations

import customtkinter as ctk
from typing import Dict, Optional


# ---------------------------------------------------------------------------
# Theme: dark mode with a professional blue / gray accent palette
# ---------------------------------------------------------------------------
COLOR_BG_ROOT = "#1e1e24"
COLOR_BG_SIDEBAR = "#18181c"
COLOR_BG_CARD = "#2a2a32"
COLOR_BG_HEADER = "#222228"
COLOR_ACCENT = "#3d7dd9"
COLOR_ACCENT_HOVER = "#5a92e6"
COLOR_TEXT_MUTED = "#9ca3af"
COLOR_TEXT_PRIMARY = "#e8e8ed"
COLOR_BORDER = "#3f3f48"


class StatCard(ctk.CTkFrame):
    """A compact stat tile with a title and a placeholder value."""

    def __init__(
        self,
        master: ctk.CTkFrame,
        title: str,
        *,
        width: int = 180,
        height: int = 100,
    ) -> None:
        super().__init__(
            master,
            fg_color=COLOR_BG_CARD,
            corner_radius=10,
            border_width=1,
            border_color=COLOR_BORDER,
            width=width,
            height=height,
        )
        self.grid_propagate(False)

        title_label = ctk.CTkLabel(
            self,
            text=title,
            font=ctk.CTkFont(size=13, weight="normal"),
            text_color=COLOR_TEXT_MUTED,
        )
        title_label.pack(anchor="w", padx=16, pady=(14, 4))

        self._value_label = ctk.CTkLabel(
            self,
            text="—",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=COLOR_ACCENT,
        )
        self._value_label.pack(anchor="w", padx=16, pady=(0, 12))

    def set_value(self, text: str) -> None:
        """Update the displayed stat value (for future wiring to real data)."""
        self._value_label.configure(text=text)


class BaseView(ctk.CTkFrame):
    """Abstract base for main-area views; subclasses fill `self.body`."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)


class HomeView(BaseView):
    """Dashboard home with placeholder stat cards."""

    def __init__(self, master: ctk.CTkFrame) -> None:
        super().__init__(master)

        heading = ctk.CTkLabel(
            self,
            text="Overview",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
        )
        heading.pack(anchor="w", pady=(0, 16))

        cards_row = ctk.CTkFrame(self, fg_color="transparent")
        cards_row.pack(fill="x")

        self.card_success = StatCard(cards_row, "Success")
        self.card_success.pack(side="left", padx=(0, 12))

        self.card_failed = StatCard(cards_row, "Failed")
        self.card_failed.pack(side="left", padx=(0, 12))

        self.card_threads = StatCard(cards_row, "Active Threads")
        self.card_threads.pack(side="left")


class PlaceholderView(BaseView):
    """Simple placeholder for sections not yet implemented."""

    def __init__(self, master: ctk.CTkFrame, title: str, subtitle: str) -> None:
        super().__init__(master)
        ctk.CTkLabel(
            self,
            text=title,
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
        ).pack(anchor="w", pady=(0, 8))
        ctk.CTkLabel(
            self,
            text=subtitle,
            font=ctk.CTkFont(size=14),
            text_color=COLOR_TEXT_MUTED,
            wraplength=520,
            justify="left",
        ).pack(anchor="w")


class LiveLogsView(BaseView):
    """Scrollable log stream for real-time automation activity."""

    def __init__(self, master: ctk.CTkFrame) -> None:
        super().__init__(master)

        header_row = ctk.CTkFrame(self, fg_color="transparent")
        header_row.pack(fill="x", pady=(0, 10))

        ctk.CTkLabel(
            header_row,
            text="Live Logs",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
        ).pack(side="left")

        self._log_box = ctk.CTkTextbox(
            self,
            font=ctk.CTkFont(size=13),
            fg_color=COLOR_BG_CARD,
            text_color=COLOR_TEXT_PRIMARY,
            border_color=COLOR_BORDER,
            border_width=1,
            corner_radius=8,
            wrap="word",
        )
        self._log_box.pack(fill="both", expand=True)

        # Seed with a few lines so the area is visibly a log console.
        self.append_line("[system] Log view ready. Connect your automation bus here.")
        self.append_line("[system] Use append_line() from your workers to stream events.")

    def append_line(self, message: str) -> None:
        """Append one line to the log and scroll to the bottom."""
        self._log_box.configure(state="normal")
        self._log_box.insert("end", message + "\n")
        self._log_box.see("end")
        self._log_box.configure(state="disabled")


class AutomationControlCenter(ctk.CTk):
    """
    Main application window: sidebar, header, and a dynamic content region.

    Navigation is driven by sidebar buttons; each view is a `BaseView` subclass
    cached in `self._views` for quick switching.
    """

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x700")
        self.minsize(900, 560)
        self.configure(fg_color=COLOR_BG_ROOT)

        self._views: Dict[str, BaseView] = {}
        self._current_key: Optional[str] = None
        self._nav_buttons: Dict[str, ctk.CTkButton] = {}

        self._build_layout()
        self._build_views()
        self.show_view("home")

    # -- layout ----------------------------------------------------------------

    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self._sidebar = ctk.CTkFrame(
            self,
            width=220,
            corner_radius=0,
            fg_color=COLOR_BG_SIDEBAR,
        )
        self._sidebar.grid(row=0, column=0, sticky="nsew")
        self._sidebar.grid_propagate(False)

        brand = ctk.CTkLabel(
            self._sidebar,
            text="Control",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
        )
        brand.pack(anchor="w", padx=20, pady=(24, 4))

        sub = ctk.CTkLabel(
            self._sidebar,
            text="Automation Suite",
            font=ctk.CTkFont(size=12),
            text_color=COLOR_TEXT_MUTED,
        )
        sub.pack(anchor="w", padx=20, pady=(0, 28))

        nav_items = [
            ("home", "Home"),
            ("credentials", "Credentials"),
            ("tasks", "Task Manager"),
            ("logs", "Live Logs"),
        ]

        for key, label in nav_items:
            btn = ctk.CTkButton(
                self._sidebar,
                text=label,
                anchor="w",
                height=40,
                corner_radius=8,
                fg_color="transparent",
                text_color=COLOR_TEXT_MUTED,
                hover_color=COLOR_BG_CARD,
                font=ctk.CTkFont(size=14),
                command=lambda k=key: self.show_view(k),
            )
            btn.pack(fill="x", padx=12, pady=4)
            self._nav_buttons[key] = btn

        # Right column: header + content
        self._right = ctk.CTkFrame(self, fg_color=COLOR_BG_ROOT, corner_radius=0)
        self._right.grid(row=0, column=1, sticky="nsew")
        self._right.grid_columnconfigure(0, weight=1)
        self._right.grid_rowconfigure(1, weight=1)

        self._header = ctk.CTkFrame(
            self._right,
            height=64,
            fg_color=COLOR_BG_HEADER,
            corner_radius=0,
        )
        self._header.grid(row=0, column=0, sticky="ew")
        self._header.grid_propagate(False)

        accent_bar = ctk.CTkFrame(
            self._header,
            width=4,
            height=28,
            corner_radius=2,
            fg_color=COLOR_ACCENT,
        )
        accent_bar.pack(side="left", padx=(24, 12), pady=18)

        self._header_title = ctk.CTkLabel(
            self._header,
            text="Automation Control Center",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
        )
        self._header_title.pack(side="left", padx=(0, 12), pady=18)

        self._content_host = ctk.CTkFrame(self._right, fg_color=COLOR_BG_ROOT)
        self._content_host.grid(row=1, column=0, sticky="nsew", padx=24, pady=(16, 24))
        self._content_host.grid_columnconfigure(0, weight=1)
        self._content_host.grid_rowconfigure(0, weight=1)

    def _build_views(self) -> None:
        """Instantiate each view once; they are shown/hidden via grid."""
        self._views["home"] = HomeView(self._content_host)
        self._views["credentials"] = PlaceholderView(
            self._content_host,
            "Credentials",
            "Secure storage for API keys and secrets will live here.",
        )
        self._views["tasks"] = PlaceholderView(
            self._content_host,
            "Task Manager",
            "Schedule, queue, and monitor automation tasks from this panel.",
        )
        self._views["logs"] = LiveLogsView(self._content_host)

        for view in self._views.values():
            view.grid(row=0, column=0, sticky="nsew")

    # -- navigation -----------------------------------------------------------

    def _set_active_nav(self, key: str) -> None:
        """Highlight the selected sidebar entry with accent styling."""
        for nav_key, btn in self._nav_buttons.items():
            if nav_key == key:
                btn.configure(
                    fg_color=COLOR_ACCENT,
                    text_color=COLOR_TEXT_PRIMARY,
                    hover_color=COLOR_ACCENT_HOVER,
                )
            else:
                btn.configure(
                    fg_color="transparent",
                    text_color=COLOR_TEXT_MUTED,
                    hover_color=COLOR_BG_CARD,
                )

    def show_view(self, key: str) -> None:
        """Bring the given view to the front and update sidebar state."""
        if key not in self._views:
            return
        if self._current_key == key:
            return

        for k, frame in self._views.items():
            if k == key:
                frame.tkraise()
            # All views share the same grid cell; tkraise is enough.

        self._current_key = key
        self._set_active_nav(key)

    # -- public hooks for future automation wiring ----------------------------

    def append_log(self, message: str) -> None:
        """Append a line to the Live Logs view if it exists."""
        logs = self._views.get("logs")
        if isinstance(logs, LiveLogsView):
            logs.append_line(message)

    def get_home_cards(self) -> Optional[HomeView]:
        """Return the home view for updating stat placeholders later."""
        home = self._views.get("home")
        return home if isinstance(home, HomeView) else None


def main() -> None:
    ctk.set_appearance_mode("dark")
    # Base theme; we override key colors via widget kwargs for blue/gray look.
    ctk.set_default_color_theme("dark-blue")

    app = AutomationControlCenter()
    app.mainloop()


if __name__ == "__main__":
    main()
