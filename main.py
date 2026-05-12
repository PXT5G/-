"""
Automation Control Center — desktop dashboard (CustomTkinter).

Run: python main.py
Requires: customtkinter
"""

from __future__ import annotations

import customtkinter as ctk
from typing import Callable, Dict, Optional


# ---------------------------------------------------------------------------
# Theme: dark mode with blue / gray accents (professional control-room feel)
# ---------------------------------------------------------------------------
COLOR_BG_APP = "#1a1b1e"
COLOR_BG_SIDEBAR = "#25262b"
COLOR_BG_CARD = "#2c2e33"
COLOR_BG_HEADER = "#25262b"
COLOR_ACCENT = "#3b82f6"
COLOR_ACCENT_HOVER = "#2563eb"
COLOR_TEXT_MUTED = "#9ca3af"
COLOR_TEXT = "#e4e4e7"
COLOR_BORDER = "#3f3f46"


class StatCard(ctk.CTkFrame):
    """Compact metric card for the Home dashboard."""

    def __init__(
        self,
        master: ctk.CTkFrame,
        title: str,
        value: str = "—",
        **kwargs,
    ) -> None:
        super().__init__(
            master,
            fg_color=COLOR_BG_CARD,
            corner_radius=12,
            border_width=1,
            border_color=COLOR_BORDER,
            **kwargs,
        )
        self.grid_columnconfigure(0, weight=1)

        self._title = ctk.CTkLabel(
            self,
            text=title,
            font=ctk.CTkFont(size=13, weight="normal"),
            text_color=COLOR_TEXT_MUTED,
            anchor="w",
        )
        self._title.grid(row=0, column=0, sticky="ew", padx=20, pady=(18, 4))

        self._value = ctk.CTkLabel(
            self,
            text=value,
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color=COLOR_ACCENT,
            anchor="w",
        )
        self._value.grid(row=1, column=0, sticky="ew", padx=20, pady=(0, 18))

    def set_value(self, text: str) -> None:
        self._value.configure(text=text)


class HomeView(ctk.CTkFrame):
    """Home: overview with placeholder stat cards."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        self.grid_columnconfigure((0, 1, 2), weight=1)

        intro = ctk.CTkLabel(
            self,
            text="Overview — connect your automation metrics here.",
            font=ctk.CTkFont(size=14),
            text_color=COLOR_TEXT_MUTED,
            anchor="w",
        )
        intro.grid(row=0, column=0, columnspan=3, sticky="ew", pady=(0, 16))

        self.card_success = StatCard(self, "Success", "0")
        self.card_success.grid(row=1, column=0, sticky="nsew", padx=(0, 8), pady=4)

        self.card_failed = StatCard(self, "Failed", "0")
        self.card_failed.grid(row=1, column=1, sticky="nsew", padx=8, pady=4)

        self.card_threads = StatCard(self, "Active Threads", "0")
        self.card_threads.grid(row=1, column=2, sticky="nsew", padx=(8, 0), pady=4)


class PlaceholderView(ctk.CTkFrame):
    """Simple placeholder for sections not built yet."""

    def __init__(self, master: ctk.CTkFrame, title: str, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        label = ctk.CTkLabel(
            self,
            text=f"{title}\n\nThis section is ready for your modules.",
            font=ctk.CTkFont(size=15),
            text_color=COLOR_TEXT_MUTED,
            justify="center",
        )
        label.place(relx=0.5, rely=0.5, anchor="center")


class LiveLogsView(ctk.CTkFrame):
    """Scrollable log stream for real-time activity."""

    def __init__(self, master: ctk.CTkFrame, **kwargs) -> None:
        super().__init__(master, fg_color="transparent", **kwargs)
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        hint = ctk.CTkLabel(
            self,
            text="Live stream — call append_log() from your automation hooks.",
            font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_MUTED,
            anchor="w",
        )
        hint.grid(row=0, column=0, sticky="ew", pady=(0, 10))

        self._text = ctk.CTkTextbox(
            self,
            font=ctk.CTkFont(family="Consolas", size=13),
            fg_color=COLOR_BG_CARD,
            text_color=COLOR_TEXT,
            border_color=COLOR_BORDER,
            border_width=1,
            corner_radius=10,
            wrap="word",
        )
        self._text.grid(row=1, column=0, sticky="nsew")

        # Read-only feel: users append via API, not by typing in the UI.
        self._text.configure(state="disabled")

        self.append_log("[system] Live Logs view ready.")

    def append_log(self, line: str) -> None:
        """Append one line to the log and scroll to the end."""
        self._text.configure(state="normal")
        self._text.insert("end", line.rstrip() + "\n")
        self._text.see("end")
        self._text.configure(state="disabled")


class AutomationControlCenter(ctk.CTk):
    """
    Main application window: sidebar navigation, header, and dynamic content.
    """

    # Map sidebar keys to human-readable titles for the header area if needed
    VIEW_TITLES = {
        "home": "Home",
        "credentials": "Credentials",
        "tasks": "Task Manager",
        "logs": "Live Logs",
    }

    def __init__(self) -> None:
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x700")
        self.minsize(900, 560)
        self.configure(fg_color=COLOR_BG_APP)

        self._current_view_key: Optional[str] = None
        self._sidebar_buttons: Dict[str, ctk.CTkButton] = {}
        self._content_views: Dict[str, ctk.CTkFrame] = {}

        self._build_layout()
        self.show_view("home")

    # -- UI construction -------------------------------------------------

    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._sidebar = self._build_sidebar()
        self._sidebar.grid(row=0, column=0, sticky="nsew")

        self._right = ctk.CTkFrame(self, fg_color=COLOR_BG_APP)
        self._right.grid(row=0, column=1, sticky="nsew")
        self._right.grid_columnconfigure(0, weight=1)
        self._right.grid_rowconfigure(1, weight=1)

        self._header = self._build_header()
        self._header.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 12))

        self._content_host = ctk.CTkFrame(self._right, fg_color="transparent")
        self._content_host.grid(row=1, column=0, sticky="nsew", padx=24, pady=(0, 24))
        self._content_host.grid_columnconfigure(0, weight=1)
        self._content_host.grid_rowconfigure(0, weight=1)

        self._register_views()

    def _build_sidebar(self) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(self, fg_color=COLOR_BG_SIDEBAR, width=220, corner_radius=0)
        frame.grid_propagate(False)

        brand = ctk.CTkLabel(
            frame,
            text="ACC",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLOR_ACCENT,
        )
        brand.pack(pady=(28, 8), padx=20, anchor="w")

        sub = ctk.CTkLabel(
            frame,
            text="Automation",
            font=ctk.CTkFont(size=12),
            text_color=COLOR_TEXT_MUTED,
        )
        sub.pack(padx=20, anchor="w")

        ctk.CTkFrame(frame, height=1, fg_color=COLOR_BORDER).pack(
            fill="x", padx=16, pady=(20, 16)
        )

        nav_items = [
            ("home", "Home"),
            ("credentials", "Credentials"),
            ("tasks", "Task Manager"),
            ("logs", "Live Logs"),
        ]
        for key, label in nav_items:
            btn = self._make_nav_button(frame, label, lambda k=key: self.show_view(k))
            btn.pack(fill="x", padx=12, pady=4)
            self._sidebar_buttons[key] = btn

        return frame

    def _make_nav_button(self, parent: ctk.CTkFrame, text: str, command: Callable[[], None]) -> ctk.CTkButton:
        return ctk.CTkButton(
            parent,
            text=text,
            anchor="w",
            height=40,
            corner_radius=8,
            font=ctk.CTkFont(size=14, weight="normal"),
            fg_color="transparent",
            text_color=COLOR_TEXT,
            hover_color="#32333a",
            border_width=0,
            command=command,
        )

    def _build_header(self) -> ctk.CTkFrame:
        shell = ctk.CTkFrame(self._right, fg_color=COLOR_BG_HEADER, corner_radius=12, height=64)
        shell.grid_columnconfigure(0, weight=1)
        shell.grid_propagate(False)

        title = ctk.CTkLabel(
            shell,
            text="Automation Control Center",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLOR_TEXT,
            anchor="w",
        )
        title.grid(row=0, column=0, sticky="w", padx=20, pady=16)

        accent_bar = ctk.CTkFrame(shell, width=4, fg_color=COLOR_ACCENT, corner_radius=2)
        accent_bar.place(relx=0, rely=0.5, anchor="w", x=8, relheight=0.45)

        return shell

    def _register_views(self) -> None:
        """Create view frames once; swap visibility in show_view."""
        self._content_views["home"] = HomeView(self._content_host)
        self._content_views["credentials"] = PlaceholderView(self._content_host, "Credentials")
        self._content_views["tasks"] = PlaceholderView(self._content_host, "Task Manager")
        self._content_views["logs"] = LiveLogsView(self._content_host)

    def _set_sidebar_active(self, key: str) -> None:
        for k, btn in self._sidebar_buttons.items():
            if k == key:
                btn.configure(fg_color=COLOR_ACCENT, hover_color=COLOR_ACCENT_HOVER, text_color="#ffffff")
            else:
                btn.configure(fg_color="transparent", hover_color="#32333a", text_color=COLOR_TEXT)

    def show_view(self, key: str) -> None:
        """Display the selected section in the main content area."""
        if key not in self._content_views:
            return

        self._set_sidebar_active(key)

        if self._current_view_key:
            self._content_views[self._current_view_key].grid_forget()

        self._content_views[key].grid(row=0, column=0, sticky="nsew")
        self._current_view_key = key

    @property
    def logs_view(self) -> LiveLogsView:
        """Convenient access for wiring automation log callbacks."""
        return self._content_views["logs"]  # type: ignore[return-value]


def main() -> None:
    ctk.set_appearance_mode("dark")
    # Base theme; we override key colors above for a cohesive blue/gray palette.
    ctk.set_default_color_theme("dark-blue")

    app = AutomationControlCenter()
    app.mainloop()


if __name__ == "__main__":
    main()
