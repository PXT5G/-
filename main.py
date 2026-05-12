"""
Automation Control Center
A modern desktop dashboard built with CustomTkinter.
Uses OOP to keep each view (Home, Credentials, Task Manager, Live Logs)
in its own class, making future extensions straightforward.
"""

import customtkinter as ctk
from datetime import datetime
import random
import threading
import time


# ---------------------------------------------------------------------------
# Global appearance
# ---------------------------------------------------------------------------
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Palette used across widgets so colours stay consistent in one place.
COLORS = {
    "sidebar_bg":    "#1a1f2e",
    "header_bg":     "#1e2538",
    "content_bg":    "#141824",
    "card_bg":       "#1e2538",
    "accent":        "#3b82f6",      # blue-500
    "accent_hover":  "#2563eb",      # blue-600
    "success":       "#22c55e",      # green-500
    "danger":        "#ef4444",      # red-500
    "warning":       "#f59e0b",      # amber-500
    "text_primary":  "#f1f5f9",
    "text_muted":    "#94a3b8",
    "border":        "#2d3748",
    "sidebar_btn_active": "#2d3a5e",
}


# ---------------------------------------------------------------------------
# Sidebar navigation button
# ---------------------------------------------------------------------------
class NavButton(ctk.CTkButton):
    """A sidebar navigation button that visually marks its active state."""

    ICON_MAP = {
        "Home":         "⌂",
        "Credentials":  "🔑",
        "Task Manager": "⚙",
        "Live Logs":    "📋",
    }

    def __init__(self, master, label: str, command, **kwargs):
        icon = self.ICON_MAP.get(label, "•")
        super().__init__(
            master,
            text=f"  {icon}  {label}",
            anchor="w",
            height=44,
            corner_radius=8,
            font=ctk.CTkFont(size=14, weight="normal"),
            fg_color="transparent",
            hover_color=COLORS["sidebar_btn_active"],
            text_color=COLORS["text_muted"],
            command=command,
            **kwargs,
        )

    def set_active(self, active: bool):
        if active:
            self.configure(
                fg_color=COLORS["sidebar_btn_active"],
                text_color=COLORS["text_primary"],
                font=ctk.CTkFont(size=14, weight="bold"),
            )
        else:
            self.configure(
                fg_color="transparent",
                text_color=COLORS["text_muted"],
                font=ctk.CTkFont(size=14, weight="normal"),
            )


# ---------------------------------------------------------------------------
# Reusable stat card (used in Home view)
# ---------------------------------------------------------------------------
class StatCard(ctk.CTkFrame):
    """A compact card that displays a metric with a coloured accent bar."""

    def __init__(self, master, title: str, value: str, accent_color: str, **kwargs):
        super().__init__(
            master,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
            **kwargs,
        )

        # Left accent bar
        accent_bar = ctk.CTkFrame(self, width=5, fg_color=accent_color, corner_radius=4)
        accent_bar.pack(side="left", fill="y", padx=(8, 0), pady=8)

        inner = ctk.CTkFrame(self, fg_color="transparent")
        inner.pack(side="left", fill="both", expand=True, padx=16, pady=12)

        self._title_label = ctk.CTkLabel(
            inner,
            text=title.upper(),
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["text_muted"],
            anchor="w",
        )
        self._title_label.pack(fill="x")

        self._value_label = ctk.CTkLabel(
            inner,
            text=value,
            font=ctk.CTkFont(size=36, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        self._value_label.pack(fill="x")

    def update_value(self, new_value: str):
        self._value_label.configure(text=new_value)


# ---------------------------------------------------------------------------
# Home View
# ---------------------------------------------------------------------------
class HomeView(ctk.CTkFrame):
    """
    Landing view shown when the user clicks 'Home'.
    Displays three stat cards (Success, Failed, Active Threads) and a
    brief welcome message.
    """

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self._build_ui()

    def _build_ui(self):
        # Section heading
        heading = ctk.CTkLabel(
            self,
            text="Dashboard Overview",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        heading.pack(fill="x", pady=(0, 4))

        subtitle = ctk.CTkLabel(
            self,
            text="Real-time snapshot of your automation pipeline.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_muted"],
            anchor="w",
        )
        subtitle.pack(fill="x", pady=(0, 24))

        # --- Stat cards row ---
        cards_frame = ctk.CTkFrame(self, fg_color="transparent")
        cards_frame.pack(fill="x")
        cards_frame.columnconfigure((0, 1, 2), weight=1, uniform="card")

        self._success_card = StatCard(
            cards_frame, title="Success", value="128",
            accent_color=COLORS["success"],
        )
        self._success_card.grid(row=0, column=0, padx=(0, 8), pady=0, sticky="nsew")

        self._failed_card = StatCard(
            cards_frame, title="Failed", value="7",
            accent_color=COLORS["danger"],
        )
        self._failed_card.grid(row=0, column=1, padx=8, pady=0, sticky="nsew")

        self._threads_card = StatCard(
            cards_frame, title="Active Threads", value="3",
            accent_color=COLORS["warning"],
        )
        self._threads_card.grid(row=0, column=2, padx=(8, 0), pady=0, sticky="nsew")

        # --- Divider ---
        divider = ctk.CTkFrame(self, height=1, fg_color=COLORS["border"])
        divider.pack(fill="x", pady=28)

        # --- Quick-info panel ---
        info_frame = ctk.CTkFrame(
            self, fg_color=COLORS["card_bg"],
            corner_radius=12, border_width=1, border_color=COLORS["border"],
        )
        info_frame.pack(fill="x")

        info_title = ctk.CTkLabel(
            info_frame,
            text="  Getting Started",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        info_title.pack(fill="x", padx=16, pady=(14, 6))

        tips = [
            "• Use  Credentials  to securely store API keys and passwords.",
            "• Use  Task Manager  to schedule and monitor automation jobs.",
            "• Use  Live Logs  to watch real-time task output.",
        ]
        for tip in tips:
            lbl = ctk.CTkLabel(
                info_frame,
                text=tip,
                font=ctk.CTkFont(size=13),
                text_color=COLORS["text_muted"],
                anchor="w",
            )
            lbl.pack(fill="x", padx=16, pady=2)

        ctk.CTkFrame(info_frame, height=12, fg_color="transparent").pack()

    def update_stats(self, success: int, failed: int, threads: int):
        """Refresh the stat card values programmatically."""
        self._success_card.update_value(str(success))
        self._failed_card.update_value(str(failed))
        self._threads_card.update_value(str(threads))


# ---------------------------------------------------------------------------
# Credentials View
# ---------------------------------------------------------------------------
class CredentialsView(ctk.CTkFrame):
    """
    Placeholder view for managing stored credentials.
    A real implementation would encrypt and persist these entries.
    """

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self._build_ui()

    def _build_ui(self):
        heading = ctk.CTkLabel(
            self,
            text="Credentials",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        heading.pack(fill="x", pady=(0, 4))

        subtitle = ctk.CTkLabel(
            self,
            text="Store and manage API keys, passwords, and tokens.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_muted"],
            anchor="w",
        )
        subtitle.pack(fill="x", pady=(0, 24))

        # Entry form
        form = ctk.CTkFrame(
            self, fg_color=COLORS["card_bg"],
            corner_radius=12, border_width=1, border_color=COLORS["border"],
        )
        form.pack(fill="x")
        form.columnconfigure(1, weight=1)

        fields = [("Label", False), ("Username / Key ID", False), ("Secret / Password", True)]

        self._entries: dict[str, ctk.CTkEntry] = {}
        for row_idx, (label_text, is_secret) in enumerate(fields):
            lbl = ctk.CTkLabel(
                form, text=label_text,
                font=ctk.CTkFont(size=13),
                text_color=COLORS["text_muted"],
                anchor="w",
            )
            lbl.grid(row=row_idx, column=0, padx=(16, 12), pady=10, sticky="w")

            entry = ctk.CTkEntry(
                form,
                show="•" if is_secret else "",
                height=36,
                corner_radius=8,
                border_color=COLORS["border"],
                fg_color=COLORS["content_bg"],
                text_color=COLORS["text_primary"],
            )
            entry.grid(row=row_idx, column=1, padx=(0, 16), pady=10, sticky="ew")
            self._entries[label_text] = entry

        save_btn = ctk.CTkButton(
            form,
            text="Save Credential",
            height=38,
            corner_radius=8,
            fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"],
            font=ctk.CTkFont(size=13, weight="bold"),
            command=self._on_save,
        )
        save_btn.grid(row=len(fields), column=0, columnspan=2, padx=16, pady=(8, 16), sticky="e")

        # Saved list (placeholder rows)
        list_label = ctk.CTkLabel(
            self,
            text="Saved Credentials",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        list_label.pack(fill="x", pady=(28, 8))

        placeholder_data = [
            ("GitHub Token", "ghp_***"),
            ("AWS Access Key", "AKIA***"),
            ("Database Password", "db_***"),
        ]
        for name, masked in placeholder_data:
            row_frame = ctk.CTkFrame(
                self, fg_color=COLORS["card_bg"],
                corner_radius=8, border_width=1, border_color=COLORS["border"],
            )
            row_frame.pack(fill="x", pady=4)

            ctk.CTkLabel(
                row_frame, text=name,
                font=ctk.CTkFont(size=13, weight="bold"),
                text_color=COLORS["text_primary"],
            ).pack(side="left", padx=16, pady=10)

            ctk.CTkLabel(
                row_frame, text=masked,
                font=ctk.CTkFont(size=12),
                text_color=COLORS["text_muted"],
            ).pack(side="left", padx=8)

            ctk.CTkButton(
                row_frame, text="Delete", width=70, height=28,
                corner_radius=6,
                fg_color="#3f1e1e", hover_color="#5c2929",
                text_color=COLORS["danger"],
                font=ctk.CTkFont(size=12),
            ).pack(side="right", padx=16, pady=8)

    def _on_save(self):
        # Placeholder – wire up persistence logic here
        pass


# ---------------------------------------------------------------------------
# Task Manager View
# ---------------------------------------------------------------------------
class TaskManagerView(ctk.CTkFrame):
    """
    Placeholder view for scheduling and monitoring automation tasks.
    """

    _SAMPLE_TASKS = [
        ("Scrape product prices",   "Running",  "Every 6 h"),
        ("Send weekly report",      "Idle",     "Every Mon"),
        ("Sync CRM contacts",       "Failed",   "Every 1 h"),
        ("Backup database",         "Running",  "Every day"),
        ("Check server health",     "Idle",     "Every 5 m"),
    ]

    _STATUS_COLORS = {
        "Running": COLORS["success"],
        "Idle":    COLORS["text_muted"],
        "Failed":  COLORS["danger"],
    }

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self._build_ui()

    def _build_ui(self):
        heading = ctk.CTkLabel(
            self,
            text="Task Manager",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        )
        heading.pack(fill="x", pady=(0, 4))

        subtitle = ctk.CTkLabel(
            self,
            text="Schedule, run, and monitor your automation tasks.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_muted"],
            anchor="w",
        )
        subtitle.pack(fill="x", pady=(0, 24))

        # Toolbar
        toolbar = ctk.CTkFrame(self, fg_color="transparent")
        toolbar.pack(fill="x", pady=(0, 12))

        ctk.CTkButton(
            toolbar, text="+ New Task", height=36, corner_radius=8,
            fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            font=ctk.CTkFont(size=13, weight="bold"),
        ).pack(side="left")

        ctk.CTkButton(
            toolbar, text="▶  Run All", height=36, corner_radius=8,
            fg_color="#1e3a2f", hover_color="#26503f",
            text_color=COLORS["success"],
            font=ctk.CTkFont(size=13),
        ).pack(side="left", padx=8)

        # Column headers
        header_row = ctk.CTkFrame(
            self, fg_color=COLORS["header_bg"],
            corner_radius=8,
        )
        header_row.pack(fill="x", pady=(0, 4))
        header_row.columnconfigure((0, 1, 2, 3), weight=1)

        for col, text in enumerate(["Task Name", "Status", "Schedule", "Actions"]):
            ctk.CTkLabel(
                header_row, text=text,
                font=ctk.CTkFont(size=12, weight="bold"),
                text_color=COLORS["text_muted"],
            ).grid(row=0, column=col, padx=16, pady=8, sticky="w")

        # Task rows
        for name, status, schedule in self._SAMPLE_TASKS:
            row = ctk.CTkFrame(
                self, fg_color=COLORS["card_bg"],
                corner_radius=8, border_width=1, border_color=COLORS["border"],
            )
            row.pack(fill="x", pady=3)
            row.columnconfigure((0, 1, 2, 3), weight=1)

            ctk.CTkLabel(
                row, text=name,
                font=ctk.CTkFont(size=13),
                text_color=COLORS["text_primary"],
                anchor="w",
            ).grid(row=0, column=0, padx=16, pady=10, sticky="w")

            status_color = self._STATUS_COLORS.get(status, COLORS["text_muted"])
            ctk.CTkLabel(
                row, text=f"● {status}",
                font=ctk.CTkFont(size=12),
                text_color=status_color,
                anchor="w",
            ).grid(row=0, column=1, padx=16, pady=10, sticky="w")

            ctk.CTkLabel(
                row, text=schedule,
                font=ctk.CTkFont(size=12),
                text_color=COLORS["text_muted"],
                anchor="w",
            ).grid(row=0, column=2, padx=16, pady=10, sticky="w")

            actions = ctk.CTkFrame(row, fg_color="transparent")
            actions.grid(row=0, column=3, padx=16, pady=6, sticky="w")

            ctk.CTkButton(
                actions, text="Run", width=54, height=28, corner_radius=6,
                fg_color="#1e3a2f", hover_color="#26503f",
                text_color=COLORS["success"],
                font=ctk.CTkFont(size=12),
            ).pack(side="left", padx=(0, 4))

            ctk.CTkButton(
                actions, text="Edit", width=54, height=28, corner_radius=6,
                fg_color="#1e2538", hover_color="#2d3a5e",
                text_color=COLORS["accent"],
                font=ctk.CTkFont(size=12),
            ).pack(side="left", padx=4)

            ctk.CTkButton(
                actions, text="Stop", width=54, height=28, corner_radius=6,
                fg_color="#3f1e1e", hover_color="#5c2929",
                text_color=COLORS["danger"],
                font=ctk.CTkFont(size=12),
            ).pack(side="left", padx=4)


# ---------------------------------------------------------------------------
# Live Logs View
# ---------------------------------------------------------------------------
class LiveLogsView(ctk.CTkFrame):
    """
    View that displays a scrollable, real-time log console.
    A background thread appends simulated log entries every second;
    call stop() before destroying the widget.
    """

    _LOG_TEMPLATES = [
        ("[INFO]    Task 'Scrape prices' started successfully.",             COLORS["text_muted"]),
        ("[SUCCESS] 42 product prices updated.",                             COLORS["success"]),
        ("[INFO]    Connecting to CRM API…",                                 COLORS["text_muted"]),
        ("[WARNING] Rate limit approaching – slowing request cadence.",      COLORS["warning"]),
        ("[ERROR]   Task 'Sync CRM' failed: ConnectionTimeoutError.",        COLORS["danger"]),
        ("[INFO]    Database backup initiated.",                              COLORS["text_muted"]),
        ("[SUCCESS] Weekly report emailed to team@example.com.",             COLORS["success"]),
        ("[INFO]    Health check passed for all 4 servers.",                 COLORS["text_muted"]),
        ("[WARNING] Disk usage at 78 %.",                                    COLORS["warning"]),
        ("[INFO]    Scheduler heartbeat OK.",                                COLORS["text_muted"]),
    ]

    def __init__(self, master, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self._running = False
        self._thread: threading.Thread | None = None
        self._build_ui()

    def _build_ui(self):
        # Header row with controls
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 12))

        ctk.CTkLabel(
            header,
            text="Live Logs",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(side="left")

        # Status indicator dot
        self._status_dot = ctk.CTkLabel(
            header, text="●  Streaming",
            font=ctk.CTkFont(size=12),
            text_color=COLORS["success"],
        )
        self._status_dot.pack(side="left", padx=16, pady=(4, 0))

        ctk.CTkButton(
            header, text="Clear", width=72, height=32, corner_radius=8,
            fg_color=COLORS["card_bg"], hover_color=COLORS["border"],
            text_color=COLORS["text_muted"],
            font=ctk.CTkFont(size=12),
            command=self._clear_logs,
        ).pack(side="right")

        ctk.CTkButton(
            header, text="Pause", width=72, height=32, corner_radius=8,
            fg_color=COLORS["card_bg"], hover_color=COLORS["border"],
            text_color=COLORS["text_muted"],
            font=ctk.CTkFont(size=12),
            command=self._toggle_pause,
        ).pack(side="right", padx=(0, 8))

        # Scrollable log console
        self._log_box = ctk.CTkTextbox(
            self,
            font=ctk.CTkFont(family="Courier", size=12),
            fg_color=COLORS["card_bg"],
            text_color=COLORS["text_muted"],
            border_color=COLORS["border"],
            border_width=1,
            corner_radius=10,
            wrap="word",
            state="disabled",
        )
        self._log_box.pack(fill="both", expand=True)

        # Colour tags for different log levels
        self._log_box.tag_config("success", foreground=COLORS["success"])
        self._log_box.tag_config("warning", foreground=COLORS["warning"])
        self._log_box.tag_config("error",   foreground=COLORS["danger"])
        self._log_box.tag_config("info",    foreground=COLORS["text_muted"])
        self._log_box.tag_config("ts",      foreground="#4b5563")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_streaming(self):
        """Begin appending simulated log lines in a background thread."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._stream_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Signal the background thread to stop (call before widget destroy)."""
        self._running = False

    def append_log(self, message: str, level: str = "info"):
        """
        Append a single log line to the console.
        level: 'info' | 'success' | 'warning' | 'error'
        """
        ts = datetime.now().strftime("%H:%M:%S")
        self._log_box.configure(state="normal")
        self._log_box.insert("end", f"[{ts}]  ", "ts")
        self._log_box.insert("end", message + "\n", level)
        self._log_box.configure(state="disabled")
        self._log_box.see("end")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _stream_loop(self):
        """Background thread: emit a random log line every ~1 s."""
        while self._running:
            template, _ = random.choice(self._LOG_TEMPLATES)
            level = self._level_from_template(template)
            # Schedule the UI update on the main thread
            self.after(0, self.append_log, template, level)
            time.sleep(random.uniform(0.8, 2.2))

    @staticmethod
    def _level_from_template(text: str) -> str:
        if "[SUCCESS]" in text:
            return "success"
        if "[WARNING]" in text:
            return "warning"
        if "[ERROR]" in text:
            return "error"
        return "info"

    def _clear_logs(self):
        self._log_box.configure(state="normal")
        self._log_box.delete("1.0", "end")
        self._log_box.configure(state="disabled")

    def _toggle_pause(self):
        if self._running:
            self.stop()
            self._status_dot.configure(text="●  Paused", text_color=COLORS["warning"])
        else:
            self.start_streaming()
            self._status_dot.configure(text="●  Streaming", text_color=COLORS["success"])


# ---------------------------------------------------------------------------
# Main Application Window
# ---------------------------------------------------------------------------
class AutomationControlCenter(ctk.CTk):
    """
    Root window and controller.
    Owns the sidebar, header, and swaps the active view frame in response to
    sidebar navigation clicks.
    """

    VIEWS = ["Home", "Credentials", "Task Manager", "Live Logs"]

    def __init__(self):
        super().__init__()
        self.title("Automation Control Center")
        self.geometry("1200x720")
        self.minsize(900, 600)
        self.configure(fg_color=COLORS["content_bg"])

        self._active_view_name: str = ""
        self._nav_buttons: dict[str, NavButton] = {}
        self._current_view: ctk.CTkFrame | None = None
        self._logs_view: LiveLogsView | None = None

        self._build_layout()
        self._show_view("Home")

    # ------------------------------------------------------------------
    # Layout construction
    # ------------------------------------------------------------------

    def _build_layout(self):
        """Construct the three-zone layout: sidebar | header + content."""
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar()
        self._build_main_area()

    def _build_sidebar(self):
        sidebar = ctk.CTkFrame(
            self,
            width=220,
            corner_radius=0,
            fg_color=COLORS["sidebar_bg"],
        )
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)
        sidebar.grid_rowconfigure(len(self.VIEWS) + 1, weight=1)

        # Brand / logo area
        brand = ctk.CTkFrame(sidebar, height=68, fg_color="transparent")
        brand.grid(row=0, column=0, padx=16, pady=(20, 16), sticky="ew")

        ctk.CTkLabel(
            brand,
            text="⚡ AutoCC",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLORS["accent"],
            anchor="w",
        ).pack(fill="x")

        ctk.CTkLabel(
            brand,
            text="Control Center",
            font=ctk.CTkFont(size=11),
            text_color=COLORS["text_muted"],
            anchor="w",
        ).pack(fill="x")

        # Thin separator
        ctk.CTkFrame(sidebar, height=1, fg_color=COLORS["border"]).grid(
            row=1, column=0, padx=16, pady=(0, 12), sticky="ew"
        )

        # Navigation buttons
        for idx, view_name in enumerate(self.VIEWS):
            btn = NavButton(
                sidebar,
                label=view_name,
                command=lambda name=view_name: self._show_view(name),
            )
            btn.grid(row=idx + 2, column=0, padx=10, pady=3, sticky="ew")
            self._nav_buttons[view_name] = btn

        # Version badge at bottom
        ctk.CTkLabel(
            sidebar,
            text="v1.0.0",
            font=ctk.CTkFont(size=11),
            text_color=COLORS["border"],
        ).grid(row=len(self.VIEWS) + 2, column=0, padx=16, pady=16, sticky="sw")

    def _build_main_area(self):
        main_area = ctk.CTkFrame(self, fg_color=COLORS["content_bg"], corner_radius=0)
        main_area.grid(row=0, column=1, sticky="nsew")
        main_area.grid_rowconfigure(1, weight=1)
        main_area.grid_columnconfigure(0, weight=1)

        self._build_header(main_area)

        # Content container — views are packed inside this
        self._content_area = ctk.CTkFrame(
            main_area, fg_color="transparent",
        )
        self._content_area.grid(row=1, column=0, padx=28, pady=20, sticky="nsew")

    def _build_header(self, parent):
        header = ctk.CTkFrame(
            parent,
            height=60,
            corner_radius=0,
            fg_color=COLORS["header_bg"],
            border_width=0,
        )
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        header.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            header,
            text="Automation Control Center",
            font=ctk.CTkFont(size=17, weight="bold"),
            text_color=COLORS["text_primary"],
            anchor="w",
        ).grid(row=0, column=0, padx=28, pady=0, sticky="w")

        # Live clock on the right
        self._clock_label = ctk.CTkLabel(
            header,
            text="",
            font=ctk.CTkFont(size=12),
            text_color=COLORS["text_muted"],
        )
        self._clock_label.grid(row=0, column=1, padx=28, sticky="e")
        self._tick_clock()

    # ------------------------------------------------------------------
    # View switching
    # ------------------------------------------------------------------

    def _show_view(self, view_name: str):
        """Destroy the current view frame and instantiate the requested one."""
        if view_name == self._active_view_name:
            return

        # Stop log streaming before destroying the logs view
        if isinstance(self._current_view, LiveLogsView):
            self._current_view.stop()
            self._logs_view = None

        if self._current_view is not None:
            self._current_view.destroy()

        # Update nav button states
        if self._active_view_name in self._nav_buttons:
            self._nav_buttons[self._active_view_name].set_active(False)
        self._nav_buttons[view_name].set_active(True)
        self._active_view_name = view_name

        # Instantiate the correct view
        view_map = {
            "Home":         HomeView,
            "Credentials":  CredentialsView,
            "Task Manager": TaskManagerView,
            "Live Logs":    LiveLogsView,
        }
        ViewClass = view_map[view_name]
        view = ViewClass(self._content_area)
        view.pack(fill="both", expand=True)
        self._current_view = view

        # Start log streaming automatically
        if isinstance(view, LiveLogsView):
            self._logs_view = view
            view.start_streaming()

    # ------------------------------------------------------------------
    # Clock helper
    # ------------------------------------------------------------------

    def _tick_clock(self):
        now = datetime.now().strftime("%a %d %b %Y  |  %H:%M:%S")
        self._clock_label.configure(text=now)
        self.after(1000, self._tick_clock)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app = AutomationControlCenter()
    app.mainloop()
