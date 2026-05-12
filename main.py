"""
Automation Control Center
=========================
A modern desktop dashboard built with CustomTkinter for managing and
monitoring automation tasks.
"""

import customtkinter as ctk
from datetime import datetime


# ---------------------------------------------------------------------------
# Global appearance configuration
# ---------------------------------------------------------------------------
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Custom color palette — professional blue/gray scheme
COLORS = {
    "sidebar_bg": "#1a1d2e",
    "header_bg": "#16192a",
    "content_bg": "#1e2235",
    "card_bg": "#252a3d",
    "accent_blue": "#3b82f6",
    "accent_hover": "#2563eb",
    "text_primary": "#e2e8f0",
    "text_secondary": "#94a3b8",
    "success": "#22c55e",
    "danger": "#ef4444",
    "warning": "#f59e0b",
    "border": "#2d3348",
}


# ---------------------------------------------------------------------------
# Reusable widget components
# ---------------------------------------------------------------------------

class StatCard(ctk.CTkFrame):
    """A card widget that displays a single statistic with a label and value."""

    def __init__(self, parent, title: str, value: str, accent_color: str, **kwargs):
        super().__init__(
            parent,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
            **kwargs,
        )

        # Accent bar at the top of the card
        accent_bar = ctk.CTkFrame(
            self, fg_color=accent_color, height=4, corner_radius=4
        )
        accent_bar.pack(fill="x", padx=16, pady=(14, 0))

        # Stat title
        ctk.CTkLabel(
            self,
            text=title.upper(),
            font=ctk.CTkFont(size=11, weight="normal"),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=16, pady=(10, 2))

        # Stat value (large number)
        self.value_label = ctk.CTkLabel(
            self,
            text=value,
            font=ctk.CTkFont(size=36, weight="bold"),
            text_color=COLORS["text_primary"],
        )
        self.value_label.pack(anchor="w", padx=16, pady=(0, 14))

    def update_value(self, new_value: str):
        """Update the displayed statistic value."""
        self.value_label.configure(text=new_value)


class SidebarButton(ctk.CTkButton):
    """A styled navigation button for the sidebar."""

    def __init__(self, parent, text: str, icon: str, command, **kwargs):
        display_text = f"  {icon}  {text}"
        super().__init__(
            parent,
            text=display_text,
            anchor="w",
            height=44,
            corner_radius=8,
            fg_color="transparent",
            hover_color=COLORS["accent_blue"],
            text_color=COLORS["text_secondary"],
            font=ctk.CTkFont(size=14),
            command=command,
            **kwargs,
        )

    def set_active(self, active: bool):
        """Highlight the button when its view is currently selected."""
        if active:
            self.configure(
                fg_color=COLORS["accent_blue"], text_color=COLORS["text_primary"]
            )
        else:
            self.configure(
                fg_color="transparent", text_color=COLORS["text_secondary"]
            )


# ---------------------------------------------------------------------------
# View frames (pages rendered in the main content area)
# ---------------------------------------------------------------------------

class HomeView(ctk.CTkFrame):
    """
    The default 'Home' view.
    Displays an overview section with three summary stat cards.
    """

    def __init__(self, parent, **kwargs):
        super().__init__(parent, fg_color=COLORS["content_bg"], **kwargs)

        # Section heading
        heading = ctk.CTkLabel(
            self,
            text="Dashboard Overview",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
        )
        heading.pack(anchor="w", padx=30, pady=(30, 4))

        ctk.CTkLabel(
            self,
            text="Real-time summary of your automation tasks.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=30, pady=(0, 24))

        # Row of stat cards
        cards_frame = ctk.CTkFrame(self, fg_color="transparent")
        cards_frame.pack(fill="x", padx=30, pady=(0, 20))
        cards_frame.columnconfigure((0, 1, 2), weight=1, uniform="card")

        self.success_card = StatCard(
            cards_frame,
            title="Success",
            value="128",
            accent_color=COLORS["success"],
        )
        self.success_card.grid(row=0, column=0, padx=(0, 10), pady=0, sticky="nsew")

        self.failed_card = StatCard(
            cards_frame,
            title="Failed",
            value="7",
            accent_color=COLORS["danger"],
        )
        self.failed_card.grid(row=0, column=1, padx=5, pady=0, sticky="nsew")

        self.threads_card = StatCard(
            cards_frame,
            title="Active Threads",
            value="4",
            accent_color=COLORS["warning"],
        )
        self.threads_card.grid(row=0, column=2, padx=(10, 0), pady=0, sticky="nsew")

        # Placeholder info panel beneath the cards
        info_frame = ctk.CTkFrame(
            self,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
        )
        info_frame.pack(fill="x", padx=30, pady=(10, 0))

        ctk.CTkLabel(
            info_frame,
            text="Quick Status",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(anchor="w", padx=20, pady=(16, 6))

        ctk.CTkLabel(
            info_frame,
            text="All systems operational.  Last sync: just now.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=20, pady=(0, 16))


class CredentialsView(ctk.CTkFrame):
    """
    Placeholder view for managing stored credentials.
    Provides input fields for adding new credential entries.
    """

    def __init__(self, parent, **kwargs):
        super().__init__(parent, fg_color=COLORS["content_bg"], **kwargs)

        ctk.CTkLabel(
            self,
            text="Credentials Manager",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(anchor="w", padx=30, pady=(30, 4))

        ctk.CTkLabel(
            self,
            text="Securely store and manage service credentials.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=30, pady=(0, 24))

        form = ctk.CTkFrame(
            self,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
        )
        form.pack(fill="x", padx=30)

        ctk.CTkLabel(
            form,
            text="Add / Update Credential",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(anchor="w", padx=20, pady=(16, 12))

        for label_text, placeholder in [
            ("Service Name", "e.g. AWS, GitHub, custom-api"),
            ("Username / API Key", "Enter identifier…"),
            ("Password / Secret", "Enter secret…"),
        ]:
            ctk.CTkLabel(
                form,
                text=label_text,
                font=ctk.CTkFont(size=12),
                text_color=COLORS["text_secondary"],
            ).pack(anchor="w", padx=20, pady=(4, 0))

            show_char = "*" if "Password" in label_text else None
            ctk.CTkEntry(
                form,
                placeholder_text=placeholder,
                show=show_char,
                height=36,
                fg_color=COLORS["content_bg"],
                border_color=COLORS["border"],
            ).pack(fill="x", padx=20, pady=(4, 8))

        ctk.CTkButton(
            form,
            text="Save Credential",
            height=38,
            fg_color=COLORS["accent_blue"],
            hover_color=COLORS["accent_hover"],
            corner_radius=8,
            font=ctk.CTkFont(size=13, weight="bold"),
        ).pack(anchor="w", padx=20, pady=(4, 20))


class TaskManagerView(ctk.CTkFrame):
    """
    Placeholder view listing scheduled / running automation tasks.
    """

    # Sample task data for demonstration
    SAMPLE_TASKS = [
        ("Daily Report Generator", "Running", COLORS["success"]),
        ("Data Scraper – Site A", "Idle", COLORS["text_secondary"]),
        ("Email Notifier", "Running", COLORS["success"]),
        ("DB Backup", "Queued", COLORS["warning"]),
        ("API Health Check", "Failed", COLORS["danger"]),
    ]

    def __init__(self, parent, **kwargs):
        super().__init__(parent, fg_color=COLORS["content_bg"], **kwargs)

        ctk.CTkLabel(
            self,
            text="Task Manager",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(anchor="w", padx=30, pady=(30, 4))

        ctk.CTkLabel(
            self,
            text="Monitor and control your automation tasks.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=30, pady=(0, 20))

        # Task list container
        list_frame = ctk.CTkScrollableFrame(
            self,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
            label_text="",
        )
        list_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        # Column headers
        header_row = ctk.CTkFrame(list_frame, fg_color="transparent")
        header_row.pack(fill="x", padx=10, pady=(10, 6))
        for col_text, col_weight in [("Task Name", 3), ("Status", 1), ("Actions", 1)]:
            ctk.CTkLabel(
                header_row,
                text=col_text.upper(),
                font=ctk.CTkFont(size=11),
                text_color=COLORS["text_secondary"],
            ).pack(side="left", expand=(col_weight > 1), padx=6)

        # Divider
        ctk.CTkFrame(
            list_frame, fg_color=COLORS["border"], height=1
        ).pack(fill="x", padx=10, pady=(0, 6))

        for name, status, color in self.SAMPLE_TASKS:
            row = ctk.CTkFrame(
                list_frame,
                fg_color=COLORS["content_bg"],
                corner_radius=8,
            )
            row.pack(fill="x", padx=10, pady=4)

            ctk.CTkLabel(
                row,
                text=name,
                font=ctk.CTkFont(size=13),
                text_color=COLORS["text_primary"],
            ).pack(side="left", padx=14, pady=10, expand=True, anchor="w")

            ctk.CTkLabel(
                row,
                text=f"● {status}",
                font=ctk.CTkFont(size=12),
                text_color=color,
            ).pack(side="left", padx=14, pady=10)

            ctk.CTkButton(
                row,
                text="Run",
                width=60,
                height=28,
                fg_color=COLORS["accent_blue"],
                hover_color=COLORS["accent_hover"],
                corner_radius=6,
                font=ctk.CTkFont(size=12),
            ).pack(side="right", padx=14, pady=8)


class LiveLogsView(ctk.CTkFrame):
    """
    Live Logs view — displays a scrollable, auto-updating log console.
    New entries can be appended via the `append_log` method.
    """

    def __init__(self, parent, **kwargs):
        super().__init__(parent, fg_color=COLORS["content_bg"], **kwargs)

        # --- Header row ---
        header_row = ctk.CTkFrame(self, fg_color="transparent")
        header_row.pack(fill="x", padx=30, pady=(30, 0))

        ctk.CTkLabel(
            header_row,
            text="Live Logs",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(side="left")

        ctk.CTkButton(
            header_row,
            text="Clear",
            width=80,
            height=32,
            fg_color=COLORS["card_bg"],
            hover_color=COLORS["border"],
            border_width=1,
            border_color=COLORS["border"],
            text_color=COLORS["text_secondary"],
            corner_radius=8,
            font=ctk.CTkFont(size=12),
            command=self._clear_logs,
        ).pack(side="right")

        ctk.CTkLabel(
            self,
            text="Real-time output from all running automation tasks.",
            font=ctk.CTkFont(size=13),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=30, pady=(4, 16))

        # --- Log console ---
        console_frame = ctk.CTkFrame(
            self,
            fg_color=COLORS["card_bg"],
            corner_radius=12,
            border_width=1,
            border_color=COLORS["border"],
        )
        console_frame.pack(fill="both", expand=True, padx=30, pady=(0, 20))

        self.log_box = ctk.CTkTextbox(
            console_frame,
            fg_color="#0d1017",           # near-black terminal feel
            text_color="#a8d8a8",          # soft green — classic terminal
            font=ctk.CTkFont(family="Courier", size=12),
            corner_radius=8,
            wrap="word",
            state="disabled",
        )
        self.log_box.pack(fill="both", expand=True, padx=10, pady=10)

        # Populate with some sample startup entries
        self._seed_sample_logs()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def append_log(self, message: str, level: str = "INFO"):
        """
        Append a timestamped log entry to the console.

        Parameters
        ----------
        message : str
            The log message text.
        level : str
            Severity label – INFO, WARN, ERROR, or DEBUG.
        """
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{timestamp}]  {level:<5}  {message}\n"

        self.log_box.configure(state="normal")
        self.log_box.insert("end", entry)
        self.log_box.see("end")   # auto-scroll to latest
        self.log_box.configure(state="disabled")

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _clear_logs(self):
        self.log_box.configure(state="normal")
        self.log_box.delete("1.0", "end")
        self.log_box.configure(state="disabled")
        self.append_log("Log cleared by user.", level="INFO")

    def _seed_sample_logs(self):
        entries = [
            ("INFO",  "Automation Control Center started."),
            ("INFO",  "Loading configuration from config.yaml…"),
            ("INFO",  "Credential store initialized."),
            ("INFO",  "Task scheduler ready — 5 tasks loaded."),
            ("INFO",  "Daily Report Generator → started."),
            ("INFO",  "Email Notifier → started."),
            ("WARN",  "API Health Check → previous run failed; retrying."),
            ("ERROR", "API Health Check → endpoint unreachable (timeout 30 s)."),
            ("INFO",  "DB Backup → queued, waiting for thread slot."),
            ("INFO",  "Dashboard ready."),
        ]
        for level, msg in entries:
            self.append_log(msg, level=level)


# ---------------------------------------------------------------------------
# Main application window
# ---------------------------------------------------------------------------

class AutomationDashboard(ctk.CTk):
    """
    Root application window.

    Responsibilities:
    - Build the three-panel layout (sidebar · header · content area).
    - Manage view switching triggered by sidebar navigation.
    """

    def __init__(self):
        super().__init__()

        self.title("Automation Control Center")
        self.geometry("1100x680")
        self.minsize(900, 580)
        self.configure(fg_color=COLORS["content_bg"])

        # Maps view names to their lazily-created frame instances
        self._view_cache: dict[str, ctk.CTkFrame] = {}
        self._active_view: str = ""

        self._build_layout()
        self._navigate("Home")   # show the Home view on startup

    # ------------------------------------------------------------------
    # Layout construction
    # ------------------------------------------------------------------

    def _build_layout(self):
        """Construct the three main regions of the dashboard."""
        # Outer grid: sidebar column + main column
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar()
        self._build_main_panel()

    def _build_sidebar(self):
        """Left-hand navigation sidebar."""
        sidebar = ctk.CTkFrame(
            self,
            width=220,
            fg_color=COLORS["sidebar_bg"],
            corner_radius=0,
        )
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)    # keep fixed width

        # App logo / brand area
        brand_frame = ctk.CTkFrame(sidebar, fg_color="transparent")
        brand_frame.pack(fill="x", padx=20, pady=(24, 20))

        ctk.CTkLabel(
            brand_frame,
            text="⚡",
            font=ctk.CTkFont(size=28),
            text_color=COLORS["accent_blue"],
        ).pack(side="left")

        ctk.CTkLabel(
            brand_frame,
            text=" AutoCtrl",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=COLORS["text_primary"],
        ).pack(side="left")

        # Thin divider
        ctk.CTkFrame(
            sidebar, fg_color=COLORS["border"], height=1
        ).pack(fill="x", padx=20, pady=(0, 16))

        ctk.CTkLabel(
            sidebar,
            text="NAVIGATION",
            font=ctk.CTkFont(size=10),
            text_color=COLORS["text_secondary"],
        ).pack(anchor="w", padx=24, pady=(0, 8))

        # Navigation buttons — store references for active-state management
        nav_items = [
            ("Home", "🏠"),
            ("Credentials", "🔑"),
            ("Task Manager", "⚙"),
            ("Live Logs", "📋"),
        ]
        self._nav_buttons: dict[str, SidebarButton] = {}
        for name, icon in nav_items:
            btn = SidebarButton(
                sidebar,
                text=name,
                icon=icon,
                command=lambda n=name: self._navigate(n),
            )
            btn.pack(fill="x", padx=12, pady=3)
            self._nav_buttons[name] = btn

        # Version footer
        ctk.CTkLabel(
            sidebar,
            text="v1.0.0",
            font=ctk.CTkFont(size=11),
            text_color=COLORS["text_secondary"],
        ).pack(side="bottom", pady=20)

    def _build_main_panel(self):
        """Right-hand panel containing the header and content area."""
        main_panel = ctk.CTkFrame(
            self, fg_color=COLORS["content_bg"], corner_radius=0
        )
        main_panel.grid(row=0, column=1, sticky="nsew")
        main_panel.grid_rowconfigure(1, weight=1)
        main_panel.grid_columnconfigure(0, weight=1)

        # Header bar
        header = ctk.CTkFrame(
            main_panel,
            fg_color=COLORS["header_bg"],
            height=60,
            corner_radius=0,
        )
        header.grid(row=0, column=0, sticky="ew")
        header.grid_propagate(False)
        header.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            header,
            text="Automation Control Center",
            font=ctk.CTkFont(size=17, weight="bold"),
            text_color=COLORS["text_primary"],
        ).grid(row=0, column=0, padx=24, pady=0, sticky="w")

        # Current date/time badge
        self._clock_label = ctk.CTkLabel(
            header,
            text="",
            font=ctk.CTkFont(size=12),
            text_color=COLORS["text_secondary"],
        )
        self._clock_label.grid(row=0, column=1, padx=24, pady=0, sticky="e")
        self._tick_clock()

        # Dynamic content area — views are stacked here
        self._content_area = ctk.CTkFrame(
            main_panel, fg_color=COLORS["content_bg"], corner_radius=0
        )
        self._content_area.grid(row=1, column=0, sticky="nsew")
        self._content_area.grid_rowconfigure(0, weight=1)
        self._content_area.grid_columnconfigure(0, weight=1)

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def _navigate(self, view_name: str):
        """
        Switch the content area to the requested view.

        Views are instantiated once and then shown/hidden via grid to
        preserve their state across navigations (e.g. log history).
        """
        if view_name == self._active_view:
            return

        # Build the view on first visit
        if view_name not in self._view_cache:
            self._view_cache[view_name] = self._create_view(view_name)

        # Hide the previously active view
        if self._active_view and self._active_view in self._view_cache:
            self._view_cache[self._active_view].grid_forget()

        # Show the requested view
        self._view_cache[view_name].grid(
            row=0, column=0, sticky="nsew", in_=self._content_area
        )
        self._active_view = view_name

        # Update sidebar button states
        for name, btn in self._nav_buttons.items():
            btn.set_active(name == view_name)

    def _create_view(self, view_name: str) -> ctk.CTkFrame:
        """Instantiate and return the correct view frame for a given name."""
        views = {
            "Home": HomeView,
            "Credentials": CredentialsView,
            "Task Manager": TaskManagerView,
            "Live Logs": LiveLogsView,
        }
        cls = views.get(view_name)
        if cls is None:
            raise ValueError(f"Unknown view: {view_name!r}")
        return cls(self._content_area)

    # ------------------------------------------------------------------
    # Clock
    # ------------------------------------------------------------------

    def _tick_clock(self):
        """Update the header clock label every second."""
        now = datetime.now().strftime("%a, %b %d  •  %H:%M:%S")
        self._clock_label.configure(text=now)
        self.after(1000, self._tick_clock)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = AutomationDashboard()
    app.mainloop()
