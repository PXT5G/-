"""
Automation Control Center — Desktop dashboard built with CustomTkinter.

Run: pip install customtkinter && python main.py
"""

from __future__ import annotations

import datetime as _dt
from typing import Callable, Dict, Optional, Type

import customtkinter as ctk


# ---------------------------------------------------------------------------
# Theme / design tokens (dark mode, blue–gray professional accent)
# ---------------------------------------------------------------------------

ACCENT_BLUE = "#3b82f6"
ACCENT_BLUE_HOVER = "#2563eb"
SIDEBAR_BG = "#1e293b"  # slate-800
CARD_BG = "#334155"  # slate-700
MAIN_BG = "#0f172a"  # slate-900
HEADER_FG = "#e2e8f0"  # slate-200
MUTED_FG = "#94a3b8"  # slate-400


def apply_global_theme() -> None:
    """Configure CustomTkinter appearance for a dark, blue-accented UI."""
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")


# ---------------------------------------------------------------------------
# Reusable UI pieces
# ---------------------------------------------------------------------------


class StatCard(ctk.CTkFrame):
    """Small metric card with a title and a prominent value (placeholder)."""

    def __init__(
        self,
        master: ctk.CTkFrame,
        title: str,
        value: str = "—",
        **kwargs,
    ) -> None:
        super().__init__(
            master,
            fg_color=CARD_BG,
            corner_radius=12,
            border_width=1,
            border_color="#475569",
            **kwargs,
        )

        self._title = ctk.CTkLabel(
            self,
            text=title,
            font=ctk.CTkFont(size=13, weight="normal"),
            text_color=MUTED_FG,
        )
        self._title.pack(anchor="w", padx=16, pady=(14, 4))

        self._value = ctk.CTkLabel(
            self,
            text=value,
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=HEADER_FG,
        )
        self._value.pack(anchor="w", padx=16, pady=(0, 14))

    def set_value(self, text: str) -> None:
        """Update the displayed metric (for when real data is wired in)."""
        self._value.configure(text=text)


# ---------------------------------------------------------------------------
# Views (one frame per sidebar destination)
# ---------------------------------------------------------------------------


class HomeView(ctk.CTkFrame):
    """Dashboard home with placeholder stat cards."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)

        intro = ctk.CTkLabel(
            self,
            text="Overview",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=HEADER_FG,
        )
        intro.pack(anchor="w", padx=8, pady=(0, 16))

        cards_row = ctk.CTkFrame(self, fg_color="transparent")
        cards_row.pack(fill="x", padx=8, pady=8)
        cards_row.grid_columnconfigure((0, 1, 2), weight=1, uniform="cards")

        self.card_success = StatCard(cards_row, title="Success", value="0")
        self.card_success.grid(row=0, column=0, padx=(0, 8), pady=0, sticky="nsew")

        self.card_failed = StatCard(cards_row, title="Failed", value="0")
        self.card_failed.grid(row=0, column=1, padx=8, pady=0, sticky="nsew")

        self.card_threads = StatCard(cards_row, title="Active Threads", value="0")
        self.card_threads.grid(row=0, column=2, padx=(8, 0), pady=0, sticky="nsew")


class CredentialsView(ctk.CTkFrame):
    """Placeholder for stored secrets / API keys management."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        label = ctk.CTkLabel(
            self,
            text="Credentials\n\nConfigure API keys and secrets here (placeholder).",
            font=ctk.CTkFont(size=16),
            text_color=MUTED_FG,
            justify="center",
        )
        label.place(relx=0.5, rely=0.5, anchor="center")


class TaskManagerView(ctk.CTkFrame):
    """Placeholder for automation task scheduling and control."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        label = ctk.CTkLabel(
            self,
            text="Task Manager\n\nStart, stop, and monitor automation jobs (placeholder).",
            font=ctk.CTkFont(size=16),
            text_color=MUTED_FG,
            justify="center",
        )
        label.place(relx=0.5, rely=0.5, anchor="center")


class LiveLogsView(ctk.CTkFrame):
    """
    Scrollable log stream for real-time activity.

    Call ``append_line`` from your automation code (or threads via
    ``self.after(0, lambda: view.append_line(...))``) to append safely
    on the Tk main loop.
    """

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)

        title = ctk.CTkLabel(
            self,
            text="Live Logs",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=HEADER_FG,
        )
        title.pack(anchor="w", padx=8, pady=(0, 8))

        self._text = ctk.CTkTextbox(
            self,
            font=ctk.CTkFont(family="Consolas", size=13),
            fg_color=CARD_BG,
            text_color=HEADER_FG,
            border_width=1,
            border_color="#475569",
            wrap="word",
        )
        self._text.pack(fill="both", expand=True, padx=8, pady=8)

        # Seed so the area is visibly ready; replace with your own stream.
        self.append_line("[system] Log view ready. Stream activity here.")
        self.append_line(
            "[hint] From worker threads use: "
            "root.after(0, lambda: logs_view.append_line('message'))"
        )

    def append_line(self, message: str) -> None:
        """Append one line with a timestamp (call from main thread or via after)."""
        ts = _dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._text.insert("end", f"[{ts}] {message}\n")
        self._text.see("end")

    def clear(self) -> None:
        """Clear the log buffer."""
        self._text.delete("1.0", "end")


# ---------------------------------------------------------------------------
# Main application window
# ---------------------------------------------------------------------------


class AutomationControlCenter(ctk.CTk):
    """
    Root window: sidebar navigation, header, and a single dynamic content region.
    """

    # Maps sidebar label -> view class to instantiate lazily
    _VIEW_REGISTRY: Dict[str, Type[ctk.CTkFrame]] = {
        "Home": HomeView,
        "Credentials": CredentialsView,
        "Task Manager": TaskManagerView,
        "Live Logs": LiveLogsView,
    }

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.minsize(960, 600)
        self.configure(fg_color=MAIN_BG)

        # --- layout: sidebar | main (header + content) ---
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._sidebar = self._build_sidebar()
        self._sidebar.grid(row=0, column=0, sticky="nsew")

        self._main = ctk.CTkFrame(self, fg_color=MAIN_BG, corner_radius=0)
        self._main.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        self._main.grid_columnconfigure(0, weight=1)
        self._main.grid_rowconfigure(1, weight=1)

        self._header = self._build_header()
        self._header.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 8))

        # Host frame for swapped views
        self._content_host = ctk.CTkFrame(self._main, fg_color="transparent")
        self._content_host.grid(row=1, column=0, sticky="nsew", padx=16, pady=(8, 16))
        self._content_host.grid_columnconfigure(0, weight=1)
        self._content_host.grid_rowconfigure(0, weight=1)

        self._nav_buttons: Dict[str, ctk.CTkButton] = {}
        self._views: Dict[str, ctk.CTkFrame] = {}
        self._current_key: Optional[str] = None

        self._build_nav_buttons()
        self.show_view("Home")

    def _build_sidebar(self) -> ctk.CTkFrame:
        bar = ctk.CTkFrame(self, width=220, corner_radius=0, fg_color=SIDEBAR_BG)
        bar.grid_propagate(False)

        brand = ctk.CTkLabel(
            bar,
            text="ACC",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=ACCENT_BLUE,
        )
        brand.pack(anchor="w", padx=20, pady=(24, 8))

        sub = ctk.CTkLabel(
            bar,
            text="Automation",
            font=ctk.CTkFont(size=12),
            text_color=MUTED_FG,
        )
        sub.pack(anchor="w", padx=20, pady=(0, 24))

        self._nav_container = ctk.CTkFrame(bar, fg_color="transparent")
        self._nav_container.pack(fill="x", padx=12, pady=8)

        return bar

    def _build_header(self) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(self._main, fg_color="transparent", height=48)
        frame.grid_columnconfigure(0, weight=1)

        title = ctk.CTkLabel(
            frame,
            text="Automation Control Center",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=HEADER_FG,
        )
        title.grid(row=0, column=0, sticky="w")

        return frame

    def _build_nav_buttons(self) -> None:
        """Create sidebar nav buttons and wire them to ``show_view``."""
        order = ["Home", "Credentials", "Task Manager", "Live Logs"]
        for key in order:
            btn = ctk.CTkButton(
                self._nav_container,
                text=key,
                anchor="w",
                height=40,
                corner_radius=8,
                fg_color="transparent",
                text_color=HEADER_FG,
                hover_color="#334155",
                font=ctk.CTkFont(size=14),
                command=self._make_nav_handler(key),
            )
            btn.pack(fill="x", pady=4)
            self._nav_buttons[key] = btn

    def _make_nav_handler(self, key: str) -> Callable[[], None]:
        return lambda: self.show_view(key)

    def _set_active_nav(self, key: str) -> None:
        """Highlight the selected sidebar item with accent colors."""
        for name, btn in self._nav_buttons.items():
            if name == key:
                btn.configure(fg_color=ACCENT_BLUE, hover_color=ACCENT_BLUE_HOVER, text_color="white")
            else:
                btn.configure(
                    fg_color="transparent",
                    hover_color="#334155",
                    text_color=HEADER_FG,
                )

    def show_view(self, key: str) -> None:
        """Swap the main content frame to the view identified by ``key``."""
        if key not in self._VIEW_REGISTRY:
            return

        # Lazily construct views once
        if key not in self._views:
            view_cls = self._VIEW_REGISTRY[key]
            self._views[key] = view_cls(self._content_host)
            self._views[key].grid(row=0, column=0, sticky="nsew")

        if self._current_key and self._current_key in self._views:
            self._views[self._current_key].grid_remove()

        self._views[key].grid(row=0, column=0, sticky="nsew")
        self._current_key = key
        self._set_active_nav(key)

    @property
    def live_logs(self) -> Optional[LiveLogsView]:
        """Convenience: access the logs view if it has been created."""
        view = self._views.get("Live Logs")
        return view if isinstance(view, LiveLogsView) else None


def main() -> None:
    apply_global_theme()
    app = AutomationControlCenter()
    app.mainloop()


if __name__ == "__main__":
    main()
