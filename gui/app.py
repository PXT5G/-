"""
TitanRE graphical dashboard — CustomTkinter dark-mode research console.

SKILL BREAKDOWN: Human-Machine Interface for Security Operations
------------------------------------------------------------------
Operators need high-signal telemetry without drowning in raw packets. The
dashboard separates module toggles (intent), status indicators (state), and
a terminal log (narrative) following situational awareness principles used in
SOC tooling — adapted for authorized lab research.
"""

from __future__ import annotations

import datetime as dt
from typing import Callable, Dict, Optional

import customtkinter as ctk

from controller import TitanREController
from models.task_model import ModuleMode, TaskState, TaskStatus


# Design tokens — dark professional blue/gray
COLORS = {
    "bg": "#0b1220",
    "panel": "#111827",
    "card": "#1f2937",
    "accent": "#3b82f6",
    "accent_hover": "#2563eb",
    "success": "#22c55e",
    "danger": "#ef4444",
    "warn": "#f59e0b",
    "text": "#e5e7eb",
    "muted": "#9ca3af",
    "border": "#374151",
}


class StatusIndicator(ctk.CTkFrame):
    """Compact labeled metric tile for dashboard telemetry."""

    def __init__(self, master: ctk.CTkFrame, title: str, **kwargs) -> None:
        super().__init__(
            master,
            fg_color=COLORS["card"],
            corner_radius=10,
            border_width=1,
            border_color=COLORS["border"],
            **kwargs,
        )
        ctk.CTkLabel(
            self,
            text=title,
            font=ctk.CTkFont(size=12),
            text_color=COLORS["muted"],
        ).pack(anchor="w", padx=12, pady=(10, 0))
        self.value_label = ctk.CTkLabel(
            self,
            text="—",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLORS["text"],
        )
        self.value_label.pack(anchor="w", padx=12, pady=(0, 10))

    def set_value(self, text: str, color: Optional[str] = None) -> None:
        self.value_label.configure(text=text, text_color=color or COLORS["text"])


class TitanREGui(ctk.CTk):
    """
    Main application window — View layer in MVC.

    SKILL BREAKDOWN: Responsive Desktop GUI
    -----------------------------------------
    ``grid`` weights and expandable text widgets keep the layout stable when
    resized. Long-running work never runs in button commands; the controller
    receives intent only, preserving interactive frame rates.
    """

    def __init__(self, controller: Optional[TitanREController] = None) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("TitanRE — Security Research Framework")
        self.geometry("1180x720")
        self.minsize(960, 600)
        self.configure(fg_color=COLORS["bg"])

        self.controller = controller or TitanREController(
            log_callback=self._threadsafe_log,
            state_callback=self._threadsafe_state,
        )

        self._module_vars: Dict[ModuleMode, ctk.BooleanVar] = {}
        self._status_color = {
            TaskStatus.IDLE: COLORS["muted"],
            TaskStatus.RUNNING: COLORS["accent"],
            TaskStatus.SUCCESS: COLORS["success"],
            TaskStatus.FAILED: COLORS["danger"],
            TaskStatus.ABORTED: COLORS["warn"],
        }

        self._build_layout()
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar().grid(row=0, column=0, sticky="nsew")
        main = ctk.CTkFrame(self, fg_color=COLORS["bg"], corner_radius=0)
        main.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(2, weight=1)

        self._build_header(main).grid(row=0, column=0, sticky="ew", padx=20, pady=(18, 8))
        self._build_status_row(main).grid(row=1, column=0, sticky="ew", padx=20, pady=8)
        self._build_log_panel(main).grid(row=2, column=0, sticky="nsew", padx=20, pady=(8, 18))

    def _build_sidebar(self) -> ctk.CTkFrame:
        sidebar = ctk.CTkFrame(self, width=250, corner_radius=0, fg_color=COLORS["panel"])
        sidebar.grid_propagate(False)

        ctk.CTkLabel(
            sidebar,
            text="TitanRE",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=COLORS["accent"],
        ).pack(anchor="w", padx=20, pady=(22, 4))
        ctk.CTkLabel(
            sidebar,
            text="Research Console",
            font=ctk.CTkFont(size=12),
            text_color=COLORS["muted"],
        ).pack(anchor="w", padx=20, pady=(0, 18))

        modules = ctk.CTkFrame(sidebar, fg_color="transparent")
        modules.pack(fill="x", padx=16, pady=8)
        ctk.CTkLabel(
            modules,
            text="MODULES",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["muted"],
        ).pack(anchor="w", pady=(0, 8))

        defaults = {
            ModuleMode.STEALTH: True,
            ModuleMode.FUZZING: False,
            ModuleMode.ANALYSIS: False,
        }
        for mode in ModuleMode:
            var = ctk.BooleanVar(value=defaults[mode])
            self._module_vars[mode] = var
            ctk.CTkSwitch(
                modules,
                text=mode.name.title(),
                variable=var,
                command=self._make_toggle_handler(mode),
                progress_color=COLORS["accent"],
            ).pack(anchor="w", pady=6)

        actions = ctk.CTkFrame(sidebar, fg_color="transparent")
        actions.pack(fill="x", padx=16, pady=20)

        ctk.CTkButton(
            actions,
            text="Run Network Probe",
            fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"],
            command=self._on_probe,
        ).pack(fill="x", pady=4)

        ctk.CTkButton(
            actions,
            text="Run Sample Fuzz",
            fg_color=COLORS["card"],
            hover_color=COLORS["border"],
            command=self._on_fuzz,
        ).pack(fill="x", pady=4)

        ctk.CTkButton(
            actions,
            text="Emergency Wipe",
            fg_color=COLORS["danger"],
            hover_color="#dc2626",
            command=self.controller.emergency_wipe,
        ).pack(fill="x", pady=(16, 4))

        return sidebar

    def _build_header(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        ctk.CTkLabel(
            frame,
            text="TitanRE — Automation & RE Control Center",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color=COLORS["text"],
        ).pack(side="left")
        self.header_status = ctk.CTkLabel(
            frame,
            text="IDLE",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=COLORS["muted"],
        )
        self.header_status.pack(side="right", padx=8)
        return frame

    def _build_status_row(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        row = ctk.CTkFrame(parent, fg_color="transparent")
        row.grid_columnconfigure((0, 1, 2), weight=1, uniform="status")

        self.ind_memory = StatusIndicator(row, "Memory Entropy")
        self.ind_memory.grid(row=0, column=0, sticky="nsew", padx=(0, 6))

        self.ind_network = StatusIndicator(row, "Network Entropy")
        self.ind_network.grid(row=0, column=1, sticky="nsew", padx=6)

        self.ind_threads = StatusIndicator(row, "Active Workers")
        self.ind_threads.grid(row=0, column=2, sticky="nsew", padx=(6, 0))

        self.ind_task = StatusIndicator(row, "Task State")
        self.ind_task.grid(row=1, column=0, columnspan=3, sticky="nsew", pady=(8, 0))
        return row

    def _build_log_panel(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure(0, weight=1)
        panel.grid_rowconfigure(1, weight=1)

        top = ctk.CTkFrame(panel, fg_color="transparent")
        top.grid(row=0, column=0, sticky="ew", padx=12, pady=(12, 4))
        ctk.CTkLabel(
            top,
            text="Live Log Viewer",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=COLORS["text"],
        ).pack(side="left")

        self.target_entry = ctk.CTkEntry(
            top,
            placeholder_text="https://example.com",
            width=280,
        )
        self.target_entry.pack(side="right")
        self.target_entry.insert(0, "https://httpbin.org/anything")

        self.log_text = ctk.CTkTextbox(
            panel,
            font=ctk.CTkFont(family="Consolas", size=12),
            fg_color="#0a0f1a",
            text_color=COLORS["text"],
            border_width=1,
            border_color=COLORS["border"],
            wrap="word",
        )
        self.log_text.grid(row=1, column=0, sticky="nsew", padx=12, pady=(4, 12))
        self._append_log("INFO", "TitanRE GUI initialized. Awaiting operator input.")
        return panel

    # ------------------------------------------------------------------
    # Controller callbacks (may arrive from background threads)
    # ------------------------------------------------------------------

    def _threadsafe_log(self, level: str, message: str) -> None:
        self.after(0, lambda: self._append_log(level, message))

    def _threadsafe_state(self, state: TaskState) -> None:
        self.after(0, lambda: self._render_state(state))

    def _append_log(self, level: str, message: str) -> None:
        ts = dt.datetime.now().strftime("%H:%M:%S")
        color_tag = level.upper()
        line = f"[{ts}] [{color_tag}] {message}\n"
        self.log_text.insert("end", line)
        self.log_text.see("end")

    def _render_state(self, state: TaskState) -> None:
        status = state.status
        self.header_status.configure(
            text=status.value.upper(),
            text_color=self._status_color.get(status, COLORS["text"]),
        )
        self.ind_memory.set_value(f"{state.memory_entropy:.2%}")
        self.ind_network.set_value(f"{state.network_entropy:.2%}")
        self.ind_threads.set_value(str(state.active_threads))
        self.ind_task.set_value(state.last_message[:48])

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    def _make_toggle_handler(self, mode: ModuleMode) -> Callable[[], None]:
        def _toggle() -> None:
            enabled = self._module_vars[mode].get()
            self.controller.toggle_module(mode, enabled)

        return _toggle

    def _on_probe(self) -> None:
        url = self.target_entry.get().strip()
        if not url:
            self._append_log("WARN", "Enter a target URL before running probe.")
            return
        self.controller.run_network_probe(url)

    def _on_fuzz(self) -> None:
        url = self.target_entry.get().strip()
        if not url:
            self._append_log("WARN", "Enter a target URL before fuzzing.")
            return
        self.controller.run_sample_fuzz(url)

    def _on_close(self) -> None:
        self.controller.stop()
        self.destroy()

    def run(self) -> None:
        self.controller.start()
        self.mainloop()
