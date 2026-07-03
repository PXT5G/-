"""
TitanRE Security Center V2 — Sovereign Core visual dashboard.

SKILL BREAKDOWN: Quantum & Memory Entropy Analysis Node
-------------------------------------------------------
Security Center V2 surfaces post-quantum agility status, constant-time memory
constancy, and decoy efficiency alongside jurisdictional shard integrity —
giving operators a unified sovereign-trust panel before engaging targets.
"""

from __future__ import annotations

import datetime as dt
from typing import Callable, Dict, List, Optional

import customtkinter as ctk

from controller import TitanREController
from models.task_model import ModuleMode, TaskState, TaskStatus, TopologyNode, WipeValidation


COLORS = {
    "bg": "#0b1220",
    "panel": "#111827",
    "card": "#1f2937",
    "accent": "#3b82f6",
    "accent_hover": "#2563eb",
    "quantum": "#8b5cf6",
    "success": "#22c55e",
    "danger": "#ef4444",
    "warn": "#f59e0b",
    "text": "#e5e7eb",
    "muted": "#9ca3af",
    "border": "#374151",
    "meter_bg": "#1a2332",
    "tier0": "#60a5fa",
    "tier1": "#34d399",
    "tier2": "#a78bfa",
}


class DynamicMeter(ctk.CTkFrame):
    """Real-time progress meter with label and numeric readout."""

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
            font=ctk.CTkFont(size=11),
            text_color=COLORS["muted"],
        ).pack(side="left")
        self.value_label = ctk.CTkLabel(
            header,
            text="—",
            font=ctk.CTkFont(size=11, weight="bold"),
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

    def set_normalized(self, value: float, *, color: Optional[str] = None, bar_color: Optional[str] = None) -> None:
        clamped = max(0.0, min(1.0, value))
        self.bar.set(clamped)
        if bar_color:
            self.bar.configure(progress_color=bar_color)
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
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLORS["text"],
        )
        self.value_label.pack(anchor="w", padx=12, pady=(0, 10))

    def set_value(self, text: str, color: Optional[str] = None) -> None:
        self.value_label.configure(text=text, text_color=color or COLORS["text"])


class CollapsibleTopologyTree(ctk.CTkScrollableFrame):
    """
    Interactive multi-tier topology tree with expand/collapse nodes.

    SKILL BREAKDOWN: Interactive Session Topology
    -----------------------------------------------
    Collapsible CTk buttons per tier avoid heavy canvas dependencies while
    teaching hierarchical attack-surface navigation — root → category → leaf.
    """

    TIER_COLORS = {0: COLORS["tier0"], 1: COLORS["tier1"], 2: COLORS["tier2"]}

    def __init__(self, master: ctk.CTkFrame, toggle_callback: Callable[[str], None], **kwargs) -> None:
        super().__init__(master, fg_color="#0a0f1a", corner_radius=8, **kwargs)
        self._toggle_callback = toggle_callback
        self._node_widgets: Dict[str, ctk.CTkFrame] = {}

    def render(self, roots: List[TopologyNode]) -> None:
        for child in self.winfo_children():
            child.destroy()
        self._node_widgets.clear()
        for root in roots:
            self._render_node(root, indent=0)

    def _render_node(self, node: TopologyNode, indent: int) -> None:
        row = ctk.CTkFrame(self, fg_color="transparent")
        row.pack(fill="x", padx=(8 + indent * 16, 4), pady=1)

        has_children = bool(node.children)
        prefix = "▼" if node.expanded and has_children else ("▶" if has_children else "•")
        tier_color = self.TIER_COLORS.get(node.tier, COLORS["text"])
        label = f"{prefix} T{node.tier} {node.label}"

        if has_children:
            btn = ctk.CTkButton(
                row,
                text=label,
                anchor="w",
                height=26,
                fg_color="transparent",
                hover_color=COLORS["border"],
                text_color=tier_color,
                font=ctk.CTkFont(family="Consolas", size=11),
                command=lambda nid=node.node_id: self._toggle_callback(nid),
            )
            btn.pack(fill="x")
        else:
            ctk.CTkLabel(
                row,
                text=f"    {label}",
                anchor="w",
                text_color=tier_color,
                font=ctk.CTkFont(family="Consolas", size=11),
            ).pack(fill="x")

        self._node_widgets[node.node_id] = row

        if node.expanded:
            for child in node.children:
                self._render_node(child, indent=indent + 1)


class TitanREGui(ctk.CTk):
    """Sovereign Core main window — Security Center V2."""

    def __init__(self, controller: Optional[TitanREController] = None) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("TitanRE — Sovereign Core Protocol Framework")
        self.geometry("1360x860")
        self.minsize(1100, 720)
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

        initial = self.controller.get_task_state()
        self._render_shard_integrity(initial)
        self._render_state(initial)

    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar().grid(row=0, column=0, sticky="nsew")

        main = ctk.CTkFrame(self, fg_color=COLORS["bg"], corner_radius=0)
        main.grid(row=0, column=1, sticky="nsew")
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(4, weight=1)

        self._build_header(main).grid(row=0, column=0, sticky="ew", padx=20, pady=(14, 4))
        self._build_quantum_node(main).grid(row=1, column=0, sticky="ew", padx=20, pady=4)
        self._build_security_center(main).grid(row=2, column=0, sticky="ew", padx=20, pady=4)
        self._build_status_row(main).grid(row=3, column=0, sticky="ew", padx=20, pady=4)

        bottom = ctk.CTkFrame(main, fg_color="transparent")
        bottom.grid(row=4, column=0, sticky="nsew", padx=20, pady=(4, 14))
        bottom.grid_columnconfigure(0, weight=3)
        bottom.grid_columnconfigure(1, weight=2)
        bottom.grid_rowconfigure(0, weight=1)

        self._build_log_panel(bottom).grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        self._build_topology_panel(bottom).grid(row=0, column=1, sticky="nsew", padx=(8, 0))

    def _build_sidebar(self) -> ctk.CTkFrame:
        sidebar = ctk.CTkFrame(self, width=270, corner_radius=0, fg_color=COLORS["panel"])
        sidebar.grid_propagate(False)

        ctk.CTkLabel(
            sidebar,
            text="TitanRE",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=COLORS["quantum"],
        ).pack(anchor="w", padx=20, pady=(20, 2))
        ctk.CTkLabel(
            sidebar,
            text="Sovereign Core Profile",
            font=ctk.CTkFont(size=12),
            text_color=COLORS["muted"],
        ).pack(anchor="w", padx=20, pady=(0, 12))

        shard_frame = ctk.CTkFrame(sidebar, fg_color=COLORS["card"], corner_radius=8)
        shard_frame.pack(fill="x", padx=14, pady=(0, 12))
        ctk.CTkLabel(
            shard_frame,
            text="JURISDICTIONAL SHARD INTEGRITY",
            font=ctk.CTkFont(size=10, weight="bold"),
            text_color=COLORS["muted"],
        ).pack(anchor="w", padx=10, pady=(8, 2))
        self.shard_indicator = ctk.CTkLabel(
            shard_frame,
            text="Verifying quorum…",
            font=ctk.CTkFont(size=11),
            text_color=COLORS["warn"],
            wraplength=230,
            justify="left",
        )
        self.shard_indicator.pack(anchor="w", padx=10, pady=(0, 8))

        modules = ctk.CTkFrame(sidebar, fg_color="transparent")
        modules.pack(fill="x", padx=16, pady=4)
        ctk.CTkLabel(
            modules,
            text="MODULES",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["muted"],
        ).pack(anchor="w", pady=(0, 6))

        defaults = {ModuleMode.STEALTH: True, ModuleMode.FUZZING: False, ModuleMode.ANALYSIS: False}
        for mode in ModuleMode:
            var = ctk.BooleanVar(value=defaults[mode])
            self._module_vars[mode] = var
            ctk.CTkSwitch(
                modules,
                text=mode.name.title(),
                variable=var,
                command=self._make_toggle_handler(mode),
                progress_color=COLORS["quantum"],
            ).pack(anchor="w", pady=5)

        actions = ctk.CTkFrame(sidebar, fg_color="transparent")
        actions.pack(fill="x", padx=16, pady=16)

        ctk.CTkButton(
            actions,
            text="Run Network Probe",
            fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"],
            command=self._on_probe,
        ).pack(fill="x", pady=3)
        ctk.CTkButton(
            actions,
            text="Run Sample Fuzz",
            fg_color=COLORS["card"],
            hover_color=COLORS["border"],
            command=self._on_fuzz,
        ).pack(fill="x", pady=3)
        ctk.CTkButton(
            actions,
            text="Emergency Wipe",
            fg_color=COLORS["danger"],
            hover_color="#dc2626",
            command=self._on_emergency_wipe,
        ).pack(fill="x", pady=(14, 3))

        self.wipe_status_label = ctk.CTkLabel(
            actions,
            text="",
            font=ctk.CTkFont(size=10),
            text_color=COLORS["muted"],
            wraplength=230,
        )
        self.wipe_status_label.pack(anchor="w", pady=(6, 0))
        return sidebar

    def _build_header(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        ctk.CTkLabel(
            frame,
            text="TitanRE — Sovereign Protocol Analysis Center",
            font=ctk.CTkFont(size=23, weight="bold"),
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

    def _build_quantum_node(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        """
        Quantum & Memory Entropy Analysis Node.

        SKILL BREAKDOWN: Post-Quantum Operational Visibility
        ------------------------------------------------------
        Surfacing memory constancy (constant-time immunity) and decoy efficiency
        adjacent to PQC agility indicators validates that sovereign crypto
        policies are active before operators launch probes.
        """
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="q")

        ctk.CTkLabel(
            panel,
            text="QUANTUM & MEMORY ENTROPY ANALYSIS NODE",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["quantum"],
        ).grid(row=0, column=0, columnspan=4, sticky="w", padx=14, pady=(10, 4))

        self.meter_constancy = DynamicMeter(
            panel, "Memory Constancy (timing immunity)", unit="%"
        )
        self.meter_constancy.grid(row=1, column=0, sticky="nsew", padx=(12, 6), pady=(0, 10))
        self.meter_constancy.bar.configure(progress_color=COLORS["quantum"])

        self.meter_decoy = DynamicMeter(panel, "Cryptographic Decoy Efficiency")
        self.meter_decoy.grid(row=1, column=1, sticky="nsew", padx=6, pady=(0, 10))
        self.meter_decoy.bar.configure(progress_color=COLORS["success"])

        self.meter_pqc = DynamicMeter(panel, "PQC Hybrid Agility")
        self.meter_pqc.grid(row=1, column=2, sticky="nsew", padx=6, pady=(0, 10))

        self.meter_poison = DynamicMeter(panel, "Tracker Poison Samples", unit="Hz")
        self.meter_poison.grid(row=1, column=3, sticky="nsew", padx=(6, 12), pady=(0, 10))
        return panel

    def _build_security_center(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="meters")

        ctk.CTkLabel(
            panel,
            text="SECURITY CENTER TELEMETRY",
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=COLORS["muted"],
        ).grid(row=0, column=0, columnspan=4, sticky="w", padx=14, pady=(10, 4))

        self.meter_memory = DynamicMeter(panel, "Memory Entropy (encrypted state)")
        self.meter_memory.grid(row=1, column=0, sticky="nsew", padx=(12, 6), pady=(0, 10))

        self.meter_encrypted = DynamicMeter(panel, "Encrypted-at-Rest Ratio")
        self.meter_encrypted.grid(row=1, column=1, sticky="nsew", padx=6, pady=(0, 10))

        self.meter_jitter = DynamicMeter(panel, "Network Jitter Frequency", unit="Hz")
        self.meter_jitter.grid(row=1, column=2, sticky="nsew", padx=6, pady=(0, 10))

        self.meter_oob = DynamicMeter(panel, "OOB Heartbeat", unit="ms")
        self.meter_oob.grid(row=1, column=3, sticky="nsew", padx=(6, 12), pady=(0, 10))
        return panel

    def _build_status_row(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        row = ctk.CTkFrame(parent, fg_color="transparent")
        row.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="status")

        self.ind_network = StatusIndicator(row, "Network Entropy")
        self.ind_network.grid(row=0, column=0, sticky="nsew", padx=(0, 6))
        self.ind_threads = StatusIndicator(row, "Active Workers")
        self.ind_threads.grid(row=0, column=1, sticky="nsew", padx=6)
        self.ind_fragments = StatusIndicator(row, "PQC Fragments")
        self.ind_fragments.grid(row=0, column=2, sticky="nsew", padx=6)
        self.ind_chaff = StatusIndicator(row, "Poison + Chaff")
        self.ind_chaff.grid(row=0, column=3, sticky="nsew", padx=(6, 0))
        self.ind_task = StatusIndicator(row, "Task State")
        self.ind_task.grid(row=1, column=0, columnspan=4, sticky="nsew", pady=(6, 0))
        return row

    def _build_log_panel(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure(0, weight=1)
        panel.grid_rowconfigure(1, weight=1)

        top = ctk.CTkFrame(panel, fg_color="transparent")
        top.grid(row=0, column=0, sticky="ew", padx=12, pady=(10, 4))
        ctk.CTkLabel(
            top,
            text="Live Log Viewer",
            font=ctk.CTkFont(size=15, weight="bold"),
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
        self.log_text.grid(row=1, column=0, sticky="nsew", padx=12, pady=(4, 10))
        self._append_log("INFO", "Sovereign Core Security Center V2 initialized.")
        return panel

    def _build_topology_panel(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        panel = ctk.CTkFrame(parent, fg_color=COLORS["panel"], corner_radius=12)
        panel.grid_columnconfigure(0, weight=1)
        panel.grid_rowconfigure(1, weight=1)

        ctk.CTkLabel(
            panel,
            text="Session Topology — Interactive Hierarchy",
            font=ctk.CTkFont(size=15, weight="bold"),
            text_color=COLORS["text"],
        ).grid(row=0, column=0, sticky="w", padx=12, pady=(10, 4))

        self.topology_tree = CollapsibleTopologyTree(
            panel,
            toggle_callback=self._on_topology_toggle,
            height=320,
        )
        self.topology_tree.grid(row=1, column=0, sticky="nsew", padx=12, pady=(4, 10))
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
        self.log_text.insert("end", f"[{ts}] [{level.upper()}] {message}\n")
        self.log_text.see("end")

    def _render_shard_integrity(self, state: TaskState) -> None:
        """
        Visual boot verification for multi-jurisdictional shard quorum.

        SKILL BREAKDOWN: Shard Integrity Visual Indicator
        ---------------------------------------------------
        Color-coded sidebar status (green quorum / amber partial / gray fresh)
        gives immediate trust signal for distributed log recovery integrity.
        """
        shard = state.shard_integrity
        if shard.quorum_met and shard.shards_present >= 3:
            color = COLORS["success"]
            icon = "✓ QUORUM"
        elif shard.shards_present > 0:
            color = COLORS["warn"]
            icon = "⚠ PARTIAL"
        else:
            color = COLORS["muted"]
            icon = "○ FRESH"
        jurisdictions = ", ".join(shard.jurisdictions) if shard.jurisdictions else "none"
        self.shard_indicator.configure(
            text=(
                f"{icon} — {shard.message}\n"
                f"Shards: {shard.shards_present}/{shard.shards_required} | "
                f"Recovered: {shard.recovered_records} | [{jurisdictions}]"
            ),
            text_color=color,
        )

    def _render_state(self, state: TaskState) -> None:
        self.header_status.configure(
            text=state.status.value.upper(),
            text_color=self._status_color.get(state.status, COLORS["text"]),
        )
        self._render_shard_integrity(state)

        tel = state.telemetry
        self.meter_memory.set_normalized(tel.memory_entropy)
        enc_color = COLORS["success"] if tel.memory_encrypted_ratio >= 0.9 else COLORS["warn"]
        self.meter_encrypted.set_normalized(tel.memory_encrypted_ratio, color=enc_color)

        const_color = COLORS["success"] if tel.memory_constancy >= 0.85 else COLORS["warn"]
        self.meter_constancy.set_normalized(tel.memory_constancy, color=const_color, bar_color=COLORS["quantum"])
        self.meter_decoy.set_normalized(tel.decoy_efficiency, bar_color=COLORS["success"])
        self.meter_pqc.set_normalized(1.0 if tel.pqc_agility_active else 0.0, bar_color=COLORS["quantum"])
        self.meter_poison.set_normalized(min(1.0, tel.tracker_poison_samples / 20.0))
        self.meter_poison.value_label.configure(text=str(tel.tracker_poison_samples))

        self.meter_jitter.set_normalized(min(1.0, tel.jitter_frequency_hz / 10.0))
        self.meter_jitter.value_label.configure(text=f"{tel.jitter_frequency_hz:.2f} Hz")
        oob_color = COLORS["success"] if tel.oob_heartbeat_ms < 2200 else COLORS["warn"]
        self.meter_oob.bar.set(min(1.0, tel.oob_heartbeat_ms / 3000.0))
        self.meter_oob.value_label.configure(text=f"{tel.oob_heartbeat_ms:.0f} ms", text_color=oob_color)

        self.ind_network.set_value(f"{state.network_entropy:.2%}")
        self.ind_threads.set_value(str(tel.active_workers))
        self.ind_fragments.set_value(str(tel.fragmented_secrets))
        self.ind_chaff.set_value(f"{tel.tracker_poison_samples}+{tel.chaff_packets}")
        self.ind_task.set_value(state.last_message[:52])

        if state.topology_tree:
            self.topology_tree.render(state.topology_tree)

    def _render_wipe_validation(self, validation: WipeValidation) -> None:
        color = COLORS["success"] if validation.success else COLORS["danger"]
        icon = "✓" if validation.success else "✗"
        self.wipe_status_label.configure(
            text=(
                f"{icon} {validation.message}\n"
                f"passes={validation.passes_executed} mem={validation.memory_artifacts_cleared} "
                f"shards={validation.shard_fragments_purged}"
            ),
            text_color=color,
        )
        self._append_log("WARN" if validation.success else "ERROR", validation.message)

    def _on_topology_toggle(self, node_id: str) -> None:
        self.controller.toggle_topology_node(node_id)

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
        dialog.title("Confirm Sovereign Emergency Wipe")
        dialog.geometry("440x210")
        dialog.configure(fg_color=COLORS["panel"])
        dialog.transient(self)
        dialog.grab_set()

        ctk.CTkLabel(
            dialog,
            text="Execute PQC memory volatilization,\njurisdictional shard purge, and DB wipe?",
            font=ctk.CTkFont(size=14),
            text_color=COLORS["text"],
        ).pack(pady=(22, 14))

        btn_row = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_row.pack()

        def _confirm() -> None:
            dialog.destroy()
            self.wipe_status_label.configure(text="Sovereign wipe in progress…", text_color=COLORS["warn"])
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
