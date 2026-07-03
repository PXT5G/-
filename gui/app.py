"""
TitanRE Security Center — enterprise visual dashboard (CustomTkinter).

SKILL BREAKDOWN: Human-Machine Interface for Security Operations
------------------------------------------------------------------
The Security Center Profile surfaces encrypted-memory ratio, jitter spectra,
and OOB heartbeat latency as dynamic meters — giving operators situational
awareness comparable to SOC consoles while preserving non-blocking MVC flow.
"""

from __future__ import annotations

import datetime as dt
from typing import Callable, Dict, Optional

import customtkinter as ctk

from controller import TitanREController
from models.task_model import ModuleMode, TaskState, TaskStatus, WipeValidation


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
    "meter_bg": "#1a2332",
}


class DynamicMeter(ctk.CTkFrame):
    """
    Real-time progress meter with label and numeric readout.

    SKILL BREAKDOWN: Dynamic Visual Telemetry
    -----------------------------------------
    CTkProgressBar provides lightweight animation without matplotlib overhead.
    Normalizing metrics to [0,1] keeps meters comparable across subsystems.
    """

    def __init__(self, master: ctk.CTkFrame, title: str, unit: str = "%", **kwargs) -> None:
        super().__init__(
            master,
            fg_color=COLORS["card"],
            corner_radius=10,
            border_width=1,
            border_color=COLORS["border"],
            **kwargs,
        )
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=12, pady=(10, 4))
        ctk.CTkLabel(
            header,
            text=title,
            font=ctk.CTkFont(size=12),
            text_color=COLORS["muted"],
        ).pack(side="left")
        self.value_label = ctk.CTkLabel(
            header,
            text="—",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color=COLORS["text"],
        )
        self.value_label.pack(side="right")
        self._unit = unit
        self.bar = ctk.CTkProgressBar(
            self,
            height=10,
            progress_color=COLORS["accent"],
            fg_color=COLORS["meter_bg"],
        )
        self.bar.pack(fill="x", padx=12, pady=(0, 12))
        self.bar.set(0)

    def set_normalized(self, value: float, *, color: Optional[str] = None) -> None:
        clamped = max(0.0, min(1.0, value))
        self.bar.set(clamped)
        if self._unit == "%":
            self.value_label.configure(text=f"{clamped:.1%}", text_color=color or COLORS["text"])
        elif self._unit == "Hz":
            self.value_label.configure(text=f"{value:.2f} Hz", text_color=color or COLORS["text"])
        else:
            self.value_label.configure(text=f"{value:.1f} ms", text_color=color or COLORS["text"])


class StatusIndicator(ctk.CTkFrame):
    """Compact labeled metric tile."""

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
    """Main application window — Security Center View layer."""

    def __init__(self, controller: Optional[TitanREController] = None) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("TitanRE — Protocol Analysis Framework")
        self.geometry("1280x800")
        self.minsize(1024, 680)
        self.configure(fg_color=COLORS["bg"])

        self.controller = controller or TitanREController(
            log_callback=self._threadsafe_log,
            state_callback=self._threadsafe_state,
            wipe_callback=self._threadsafe_wipe_validation,
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
        main.grid(row=0, column=1, sticky="nsew")
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(3, weight=1)

        self._build_header(main).grid(row=0, column=0, sticky="ew", padx=20, pady=(16, 6))
        self._build_security_center(main).grid(row=1, column=0, sticky="ew", padx=20, pady=6)
        self._build_status_row(main).grid(row=2, column=0, sticky="ew", padx=20, pady=6)

        bottom = ctk.CTkFrame(main, fg_color="transparent")
        bottom.grid(row=3, column=0, sticky="nsew", padx=20, pady=(6, 16))
        bottom.grid_columnconfigure(0, weight=3)
        bottom.grid_columnconfigure(1, weight=2)
        bottom.grid_rowconfigure(0, weight=1)

        self._build_log_panel(bottom).grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        self._build_topology_panel(bottom).grid(row=0, column=1, sticky="nsew", padx=(8, 0))

    def _build_sidebar(self) -> ctk.CTkFrame:
        sidebar = ctk.CTkFrame(self, width=260, corner_radius=0, fg_color=COLORS["panel"])
        sidebar.grid_propagate(False)

        ctk.CTkLabel(
            sidebar,
            text="TitanRE",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=COLORS["accent"],
        ).pack(anchor="w", padx=20, pady=(22, 4))
        ctk.CTkLabel(
            sidebar,
            text="Security Center Profile",
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
            command=self._on_emergency_wipe,
        ).pack(fill="x", pady=(16, 4))

        self.wipe_status_label = ctk.CTkLabel(
            actions,
            text="",
            font=ctk.CTkFont(size=11),
            text_color=COLORS["muted"],
            wraplength=220,
        )
        self.wipe_status_label.pack(anchor="w", pady=(8, 0))

        return sidebar

    def _build_header(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        ctk.CTkLabel(
            frame,
            text="TitanRE — Protocol Analysis Control Center",
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

    def _build_security_center(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        """
        Security Center Profile — dynamic meters row.

        SKILL BREAKDOWN: Security Center Profile Layout
        -----------------------------------------------
        Grouping encrypted-memory, jitter frequency, and OOB heartbeat meters
        in one band gives at-a-glance assurance that anti-forensics and stealth
        subsystems are active before launching probes.
        """
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="meters")

        ctk.CTkLabel(
            panel,
            text="SECURITY CENTER TELEMETRY",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["muted"],
        ).grid(row=0, column=0, columnspan=4, sticky="w", padx=14, pady=(12, 6))

        self.meter_memory = DynamicMeter(panel, "Memory Entropy (encrypted state)")
        self.meter_memory.grid(row=1, column=0, sticky="nsew", padx=(12, 6), pady=(0, 12))

        self.meter_encrypted = DynamicMeter(panel, "Encrypted-at-Rest Ratio")
        self.meter_encrypted.grid(row=1, column=1, sticky="nsew", padx=6, pady=(0, 12))

        self.meter_jitter = DynamicMeter(panel, "Network Jitter Frequency", unit="Hz")
        self.meter_jitter.grid(row=1, column=2, sticky="nsew", padx=6, pady=(0, 12))

        self.meter_oob = DynamicMeter(panel, "OOB Heartbeat", unit="ms")
        self.meter_oob.grid(row=1, column=3, sticky="nsew", padx=(6, 12), pady=(0, 12))

        return panel

    def _build_status_row(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        row = ctk.CTkFrame(parent, fg_color="transparent")
        row.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="status")

        self.ind_network = StatusIndicator(row, "Network Entropy")
        self.ind_network.grid(row=0, column=0, sticky="nsew", padx=(0, 6))

        self.ind_threads = StatusIndicator(row, "Active Workers")
        self.ind_threads.grid(row=0, column=1, sticky="nsew", padx=6)

        self.ind_fragments = StatusIndicator(row, "Fragmented Secrets")
        self.ind_fragments.grid(row=0, column=2, sticky="nsew", padx=6)

        self.ind_chaff = StatusIndicator(row, "Chaff Packets")
        self.ind_chaff.grid(row=0, column=3, sticky="nsew", padx=(6, 0))

        self.ind_task = StatusIndicator(row, "Task State")
        self.ind_task.grid(row=1, column=0, columnspan=4, sticky="nsew", pady=(8, 0))
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

        self.target_entry = ctk.CTkEntry(top, placeholder_text="https://example.com", width=280)
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
        self._append_log("INFO", "TitanRE Security Center initialized.")
        return panel

    def _build_topology_panel(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        """
        Session Topology View — live structured tree of discovered endpoints.

        SKILL BREAKDOWN: Session Topology View
        ----------------------------------------
        Text-based graph layout avoids heavy graph widget deps while still
        teaching how endpoint discovery and API dependency graphs converge
        into an attack-surface map during analysis sessions.
        """
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure(0, weight=1)
        panel.grid_rowconfigure(1, weight=1)

        ctk.CTkLabel(
            panel,
            text="Session Topology View",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=COLORS["text"],
        ).grid(row=0, column=0, sticky="w", padx=12, pady=(12, 4))

        self.topology_text = ctk.CTkTextbox(
            panel,
            font=ctk.CTkFont(family="Consolas", size=11),
            fg_color="#0a0f1a",
            text_color=COLORS["success"],
            border_width=1,
            border_color=COLORS["border"],
            wrap="none",
        )
        self.topology_text.grid(row=1, column=0, sticky="nsew", padx=12, pady=(4, 12))
        self.topology_text.insert("end", "(awaiting probe/fuzz for topology…)\n")
        return panel

    # ------------------------------------------------------------------
    # Controller callbacks
    # ------------------------------------------------------------------

    def _threadsafe_log(self, level: str, message: str) -> None:
        self.after(0, lambda: self._append_log(level, message))

    def _threadsafe_state(self, state: TaskState) -> None:
        self.after(0, lambda: self._render_state(state))

    def _threadsafe_wipe_validation(self, validation: WipeValidation) -> None:
        self.after(0, lambda: self._render_wipe_validation(validation))

    def _append_log(self, level: str, message: str) -> None:
        ts = dt.datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] [{level.upper()}] {message}\n"
        self.log_text.insert("end", line)
        self.log_text.see("end")

    def _render_state(self, state: TaskState) -> None:
        status = state.status
        self.header_status.configure(
            text=status.value.upper(),
            text_color=self._status_color.get(status, COLORS["text"]),
        )

        tel = state.telemetry
        self.meter_memory.set_normalized(tel.memory_entropy)
        enc_color = COLORS["success"] if tel.memory_encrypted_ratio >= 0.9 else COLORS["warn"]
        self.meter_encrypted.set_normalized(tel.memory_encrypted_ratio, color=enc_color)
        self.meter_jitter.set_normalized(min(1.0, tel.jitter_frequency_hz / 10.0))
        self.meter_jitter.value_label.configure(text=f"{tel.jitter_frequency_hz:.2f} Hz")
        oob_color = COLORS["success"] if tel.oob_heartbeat_ms < 2200 else COLORS["warn"]
        self.meter_oob.bar.set(min(1.0, tel.oob_heartbeat_ms / 3000.0))
        self.meter_oob.value_label.configure(text=f"{tel.oob_heartbeat_ms:.0f} ms", text_color=oob_color)

        self.ind_network.set_value(f"{state.network_entropy:.2%}")
        self.ind_threads.set_value(str(tel.active_workers))
        self.ind_fragments.set_value(str(tel.fragmented_secrets))
        self.ind_chaff.set_value(str(tel.chaff_packets))
        self.ind_task.set_value(state.last_message[:56])

        if state.session_topology:
            self._render_topology(state.session_topology)

    def _render_topology(self, lines: list[str]) -> None:
        self.topology_text.delete("1.0", "end")
        for line in lines:
            self.topology_text.insert("end", line + "\n")

    def _render_wipe_validation(self, validation: WipeValidation) -> None:
        """
        Visual validation after Emergency Wipe completes.

        SKILL BREAKDOWN: Wipe Visual Validation
        ---------------------------------------
        Operators require explicit confirmation of fragment destruction and DB
        row counts — this label turns anti-forensics outcomes into auditable UI
        state without exposing sensitive content.
        """
        if validation.success:
            color = COLORS["success"]
            icon = "✓"
        else:
            color = COLORS["danger"]
            icon = "✗"
        self.wipe_status_label.configure(
            text=(
                f"{icon} {validation.message}\n"
                f"passes={validation.passes_executed} "
                f"fragments={validation.fragments_destroyed} "
                f"db={validation.db_rows_purged}"
            ),
            text_color=color,
        )
        self._append_log("WARN" if validation.success else "ERROR", validation.message)

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    def _make_toggle_handler(self, mode: ModuleMode) -> Callable[[], None]:
        def _toggle() -> None:
            self.controller.toggle_module(mode, self._module_vars[mode].get())

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

    def _on_emergency_wipe(self) -> None:
        dialog = ctk.CTkToplevel(self)
        dialog.title("Confirm Emergency Wipe")
        dialog.geometry("420x200")
        dialog.configure(fg_color=COLORS["panel"])
        dialog.transient(self)
        dialog.grab_set()

        ctk.CTkLabel(
            dialog,
            text="Execute multi-layer memory volatilization\nand SQLite transactional purge?",
            font=ctk.CTkFont(size=14),
            text_color=COLORS["text"],
        ).pack(pady=(24, 16))

        btn_row = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_row.pack()

        def _confirm() -> None:
            dialog.destroy()
            self.wipe_status_label.configure(text="Wipe in progress…", text_color=COLORS["warn"])
            self.controller.emergency_wipe()

        ctk.CTkButton(
            btn_row,
            text="Confirm Wipe",
            fg_color=COLORS["danger"],
            hover_color="#dc2626",
            command=_confirm,
        ).pack(side="left", padx=8)

        ctk.CTkButton(
            btn_row,
            text="Cancel",
            fg_color=COLORS["card"],
            command=dialog.destroy,
        ).pack(side="left", padx=8)

    def _on_close(self) -> None:
        self.controller.stop()
        self.destroy()

    def run(self) -> None:
        self.controller.start()
        self.mainloop()
