"""Main application window (CustomTkinter) -- modern "cosmos" dark theme.

Architecture (MVVM-ish separation of concerns):

* The **engine** (``core``) does all analysis and knows nothing about the UI.
* This module is the **view**: it renders state and forwards user intent.
* Scans run on a **background thread**; results are handed back to the Tk main
  loop through a :class:`queue.Queue` polled with ``after`` so the UI never
  blocks (non-blocking micro-interaction feedback).

Visual language is centralised in :mod:`gui.theme` (palette, gradient helpers,
icons) so the look stays consistent and easy to retune.
"""

from __future__ import annotations

import math
import os
import queue
import threading
from tkinter import filedialog

import customtkinter as ctk

from core.disassembler import disassemble
from core.models import ScanResult, Severity
from core.scanner import scan_path
from core.storage import ScanStore
from gui.theme import COLORS, NAV_ICONS, SEVERITY_ICONS, paint_horizontal_gradient


class AnalyzerApp(ctk.CTk):
    """Top-level window for the defensive code analysis toolkit."""

    NAV_ITEMS = ("Dashboard", "Findings", "Attack Surface",
                 "Architecture", "Disassembler", "History")

    VIEW_SUBTITLES = {
        "Dashboard": "Security posture at a glance",
        "Findings": "Detected weaknesses mapped to CWE",
        "Attack Surface": "Where untrusted input enters",
        "Architecture": "Modules and internal dependencies",
        "Disassembler": "CPython bytecode (never executed)",
        "History": "Previously saved scan runs",
    }

    def __init__(self) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("Defensive Code Analysis Toolkit")
        self.geometry("1240x800")
        self.minsize(1060, 700)
        self.configure(fg_color=COLORS["background"])

        self.store = ScanStore()
        self.result: ScanResult | None = None
        self._events: queue.Queue = queue.Queue()
        self._scanning = False
        self._active = "Dashboard"
        self.scan_target = ctk.StringVar(value=os.path.abspath("sample_target"))

        self._build_layout()
        self._show("Dashboard")
        self.after(100, self._drain_events)

    # ------------------------------------------------------------------ layout
    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar()

        main = ctk.CTkFrame(self, fg_color="transparent")
        main.grid(row=0, column=1, sticky="nsew")
        main.grid_columnconfigure(0, weight=1)
        main.grid_rowconfigure(2, weight=1)

        self._build_hero(main)
        self._build_toolbar(main)

        self.content = ctk.CTkFrame(main, fg_color=COLORS["surface"],
                                    corner_radius=18, border_width=1,
                                    border_color=COLORS["border"])
        self.content.grid(row=2, column=0, sticky="nsew", padx=24, pady=(6, 24))
        self.content.grid_columnconfigure(0, weight=1)
        self.content.grid_rowconfigure(0, weight=1)

    def _build_sidebar(self) -> None:
        sidebar = ctk.CTkFrame(self, width=248, corner_radius=0,
                               fg_color=COLORS["sidebar"])
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)
        sidebar.grid_rowconfigure(99, weight=1)

        # Gradient brand header.
        brand = ctk.CTkCanvas(sidebar, height=104, highlightthickness=0,
                              bd=0, bg=COLORS["sidebar"])
        brand.grid(row=0, column=0, sticky="ew", padx=0, pady=0)

        def _paint_brand(_e=None) -> None:
            w = brand.winfo_width() or 248
            paint_horizontal_gradient(brand, w, 104, COLORS["grad_start"],
                                      COLORS["grad_end"])
            brand.delete("brandtext")
            brand.create_text(24, 40, anchor="w", text="\u25C8  DEFENSIVE",
                              fill="#FFFFFF", tags="brandtext",
                              font=("TkDefaultFont", 17, "bold"))
            brand.create_text(24, 66, anchor="w", text="ANALYZER",
                              fill="#E9E5FF", tags="brandtext",
                              font=("TkDefaultFont", 13, "bold"))
        brand.bind("<Configure>", _paint_brand)
        self.after(30, _paint_brand)

        # Navigation.
        self.nav_rows: dict[str, tuple[ctk.CTkFrame, ctk.CTkFrame, ctk.CTkButton]] = {}
        for i, item in enumerate(self.NAV_ITEMS, start=1):
            row = ctk.CTkFrame(sidebar, fg_color="transparent", height=48)
            row.grid(row=i, column=0, sticky="ew", padx=12, pady=3)
            row.grid_columnconfigure(1, weight=1)

            indicator = ctk.CTkFrame(row, width=4, height=30, corner_radius=4,
                                     fg_color="transparent")
            indicator.grid(row=0, column=0, sticky="ns", padx=(0, 6))

            btn = ctk.CTkButton(
                row, text=f"  {NAV_ICONS.get(item, '')}   {item}",
                height=44, corner_radius=12, anchor="w",
                fg_color="transparent", hover_color=COLORS["surface_2"],
                text_color=COLORS["text_soft"],
                font=ctk.CTkFont(size=14, weight="bold"),
                command=lambda name=item: self._show(name))
            btn.grid(row=0, column=1, sticky="ew")
            self.nav_rows[item] = (row, indicator, btn)

        footer = ctk.CTkFrame(sidebar, fg_color="transparent")
        footer.grid(row=100, column=0, sticky="ew", padx=22, pady=18)
        ctk.CTkLabel(footer, text="v1.0.0  \u00b7  stdlib engine",
                     text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=11)).pack(anchor="w")
        ctk.CTkLabel(footer, text="defensive \u00b7 analytical only",
                     text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=11)).pack(anchor="w")

    def _build_hero(self, parent) -> None:
        self.hero = ctk.CTkCanvas(parent, height=92, highlightthickness=0,
                                  bd=0, bg=COLORS["background"])
        self.hero.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 8))
        self.hero.bind("<Configure>", lambda _e: self._paint_hero())

    def _paint_hero(self) -> None:
        w = self.hero.winfo_width() or 900
        h = 92
        paint_horizontal_gradient(self.hero, w, h, COLORS["grad_start"],
                                  COLORS["grad_end"])
        # Decorative "orbit" circles echoing the network/cosmos motif.
        self.hero.delete("herofx")
        for r, col in ((150, COLORS["grad_cyan"]), (95, "#C4B5FD")):
            self.hero.create_oval(w - r, h - r, w + r, h + r, outline=col,
                                  width=1, tags="herofx")
        self.hero.delete("herotext")
        self.hero.create_text(26, 34, anchor="w", text=self._active,
                              fill="#FFFFFF", tags="herotext",
                              font=("TkDefaultFont", 22, "bold"))
        self.hero.create_text(28, 64, anchor="w",
                              text=self.VIEW_SUBTITLES.get(self._active, ""),
                              fill="#E4DEFF", tags="herotext",
                              font=("TkDefaultFont", 12))

    def _build_toolbar(self, parent) -> None:
        bar = ctk.CTkFrame(parent, fg_color=COLORS["surface"], corner_radius=14,
                           border_width=1, border_color=COLORS["border"])
        bar.grid(row=1, column=0, sticky="ew", padx=24, pady=(4, 6))
        bar.grid_columnconfigure(1, weight=1)

        ctk.CTkLabel(bar, text="  \U0001F4C1", font=ctk.CTkFont(size=16),
                     text_color=COLORS["muted"]).grid(row=0, column=0, padx=(10, 0),
                                                       pady=12)
        entry = ctk.CTkEntry(bar, textvariable=self.scan_target, height=42,
                             placeholder_text="Path to scan\u2026", border_width=1,
                             fg_color=COLORS["surface_2"],
                             border_color=COLORS["border_light"])
        entry.grid(row=0, column=1, sticky="ew", padx=10, pady=12)

        ctk.CTkButton(bar, text="Browse", width=96, height=42,
                      fg_color=COLORS["surface_3"], hover_color=COLORS["border_light"],
                      corner_radius=10, command=self._browse).grid(
            row=0, column=2, padx=6, pady=12)
        self.scan_button = ctk.CTkButton(
            bar, text="\u26A1  Scan", width=132, height=42,
            fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            corner_radius=10, font=ctk.CTkFont(size=14, weight="bold"),
            command=self._start_scan)
        self.scan_button.grid(row=0, column=3, padx=(6, 12), pady=12)

        self.status_dot = ctk.CTkLabel(bar, text="\u25CF", text_color=COLORS["muted"],
                                       font=ctk.CTkFont(size=13))
        self.status_dot.grid(row=1, column=0, sticky="e", pady=(0, 10))
        self.status = ctk.CTkLabel(bar, text="Ready.", text_color=COLORS["muted"],
                                   anchor="w", font=ctk.CTkFont(size=12))
        self.status.grid(row=1, column=1, columnspan=3, sticky="w", pady=(0, 10))

    # ------------------------------------------------------------- navigation
    def _show(self, name: str) -> None:
        self._active = name
        for item, (_row, indicator, btn) in self.nav_rows.items():
            active = item == name
            btn.configure(
                fg_color=COLORS["accent_soft"] if active else "transparent",
                text_color=COLORS["text"] if active else COLORS["text_soft"])
            indicator.configure(fg_color=COLORS["accent"] if active else "transparent")
        self._paint_hero()
        for child in self.content.winfo_children():
            child.destroy()
        {
            "Dashboard": self._view_dashboard,
            "Findings": self._view_findings,
            "Attack Surface": self._view_attack_surface,
            "Architecture": self._view_architecture,
            "Disassembler": self._view_disassembler,
            "History": self._view_history,
        }[name]()

    # ---------------------------------------------------------------- helpers
    def _scroll_body(self) -> ctk.CTkScrollableFrame:
        body = ctk.CTkScrollableFrame(self.content, fg_color="transparent",
                                      scrollbar_button_color=COLORS["surface_3"],
                                      scrollbar_button_hover_color=COLORS["accent"])
        body.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        body.grid_columnconfigure(0, weight=1)
        return body

    @staticmethod
    def _placeholder(parent, text: str) -> None:
        box = ctk.CTkFrame(parent, fg_color=COLORS["surface_2"], corner_radius=14)
        box.grid(row=parent.grid_size()[1], column=0, sticky="ew", pady=8)
        ctk.CTkLabel(box, text="\U0001F50D  " + text, text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=13)).pack(anchor="w", padx=20, pady=26)

    def _attach_hover(self, card, base: str, hover: str) -> None:
        """Lift a card's background while the pointer is over it or its children."""
        def on_enter(_e=None) -> None:
            card.configure(fg_color=hover)

        def on_leave(_e=None) -> None:
            x, y = card.winfo_pointerxy()
            widget = card.winfo_containing(x, y)
            node = widget
            while node is not None:
                if node == card:
                    return
                node = getattr(node, "master", None)
            card.configure(fg_color=base)

        def bind_recursive(widget) -> None:
            widget.bind("<Enter>", on_enter, add="+")
            widget.bind("<Leave>", on_leave, add="+")
            for child in widget.winfo_children():
                bind_recursive(child)

        bind_recursive(card)

    # -------------------------------------------------------------- dashboard
    def _view_dashboard(self) -> None:
        body = self._scroll_body()
        if self.result is None:
            self._placeholder(body, "No scan yet. Choose a path above and press "
                                    "Scan to analyze a codebase.")
            return

        counts = self.result.severity_counts()
        cards = ctk.CTkFrame(body, fg_color="transparent")
        cards.grid(row=0, column=0, sticky="ew")
        for i in range(5):
            cards.grid_columnconfigure(i, weight=1, uniform="m")
        metrics = [("Critical", counts[Severity.CRITICAL], Severity.CRITICAL.color),
                   ("High", counts[Severity.HIGH], Severity.HIGH.color),
                   ("Medium", counts[Severity.MEDIUM], Severity.MEDIUM.color),
                   ("Low", counts[Severity.LOW], Severity.LOW.color),
                   ("Info", counts[Severity.INFO], Severity.INFO.color)]
        for col, (label, value, color) in enumerate(metrics):
            self._metric_card(cards, col, label, value, color)

        # Secondary statistics panel.
        panel = ctk.CTkFrame(body, fg_color=COLORS["surface_2"], corner_radius=16,
                             border_width=1, border_color=COLORS["border"])
        panel.grid(row=1, column=0, sticky="ew", pady=(18, 0))
        panel.grid_columnconfigure((0, 1, 2), weight=1, uniform="s")
        ctk.CTkLabel(panel, text="Scan overview", text_color=COLORS["text"],
                     font=ctk.CTkFont(size=15, weight="bold")).grid(
            row=0, column=0, columnspan=3, sticky="w", padx=20, pady=(16, 4))
        stats = [("Files scanned", self.result.files_scanned, "\U0001F4C4"),
                 ("Total findings", len(self.result.findings), "\U0001F9EA"),
                 ("Attack surface", len(self.result.attack_surface), "\U0001F310"),
                 ("Modules", len(self.result.modules), "\U0001F9E9"),
                 ("Dependencies", len(self.result.dependencies), "\U0001F517"),
                 ("Parse errors", len(self.result.errors), "\u26A0")]
        for i, (label, value, icon) in enumerate(stats):
            box = ctk.CTkFrame(panel, fg_color="transparent")
            box.grid(row=1 + i // 3, column=i % 3, sticky="ew", padx=20, pady=12)
            ctk.CTkLabel(box, text=f"{icon}  {value}", text_color=COLORS["text"],
                         font=ctk.CTkFont(size=22, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(box, text=label, text_color=COLORS["muted"],
                         font=ctk.CTkFont(size=12)).pack(anchor="w")

        # Top findings preview.
        top = self.result.sorted_findings()[:5]
        if top:
            ctk.CTkLabel(body, text="Top findings", text_color=COLORS["text"],
                         font=ctk.CTkFont(size=15, weight="bold")).grid(
                row=2, column=0, sticky="w", pady=(20, 6))
            for f in top:
                self._finding_row(body, f, compact=True)

    def _metric_card(self, parent, col, label, value, color) -> None:
        card = ctk.CTkFrame(parent, fg_color=COLORS["surface_2"], corner_radius=16,
                            border_width=1, border_color=COLORS["border"])
        card.grid(row=0, column=col, padx=6, pady=6, sticky="nsew")
        strip = ctk.CTkFrame(card, height=4, corner_radius=4, fg_color=color)
        strip.pack(fill="x", padx=14, pady=(12, 0))
        ctk.CTkLabel(card, text=str(value), text_color=color,
                     font=ctk.CTkFont(size=32, weight="bold")).pack(
            anchor="w", padx=16, pady=(8, 0))
        ctk.CTkLabel(card, text=f"{SEVERITY_ICONS.get(label, '')}  {label.upper()}",
                     text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=12, weight="bold")).pack(
            anchor="w", padx=16, pady=(0, 16))
        self._attach_hover(card, COLORS["surface_2"], COLORS["surface_3"])

    # --------------------------------------------------------------- findings
    def _view_findings(self) -> None:
        body = self._scroll_body()
        if not self.result or not self.result.findings:
            self._placeholder(body, "No findings to display. Run a scan first.")
            return
        for f in self.result.sorted_findings():
            self._finding_row(body, f)

    def _finding_row(self, parent, f, compact: bool = False) -> None:
        base = COLORS["surface_2"]
        row = ctk.CTkFrame(parent, fg_color=base, corner_radius=12,
                           border_width=1, border_color=COLORS["border"])
        row.grid(row=parent.grid_size()[1], column=0, sticky="ew", pady=5)
        row.grid_columnconfigure(1, weight=1)

        badge = ctk.CTkLabel(row, text=f" {f.severity.label.upper()} ",
                             fg_color=f.severity.color, text_color="#0A0A12",
                             corner_radius=8, font=ctk.CTkFont(size=11, weight="bold"))
        badge.grid(row=0, column=0, padx=14, pady=14, sticky="nw")

        head = ctk.CTkFrame(row, fg_color="transparent")
        head.grid(row=0, column=1, sticky="ew", padx=(0, 14), pady=12)
        head.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(head, text=f.title, text_color=COLORS["text"], anchor="w",
                     font=ctk.CTkFont(size=14, weight="bold")).grid(
            row=0, column=0, sticky="w")

        meta = ctk.CTkFrame(head, fg_color="transparent")
        meta.grid(row=1, column=0, sticky="w", pady=(3, 0))
        for text, color in ((f.cwe, COLORS["accent"]),
                            (f.rule_id, COLORS["muted"]),
                            (f.category, COLORS["muted"])):
            ctk.CTkLabel(meta, text=f" {text} ", text_color=color,
                         fg_color=COLORS["surface_3"], corner_radius=6,
                         font=ctk.CTkFont(size=11)).pack(side="left", padx=(0, 6))

        ctk.CTkLabel(head, text=f"\U0001F4CD {f.file}:{f.line}",
                     text_color=COLORS["text_soft"], anchor="w",
                     font=ctk.CTkFont(size=12)).grid(row=2, column=0, sticky="w",
                                                     pady=(4, 0))
        if not compact and f.snippet:
            ctk.CTkLabel(head, text=f.snippet, text_color=COLORS["muted"], anchor="w",
                         font=ctk.CTkFont(family="TkFixedFont", size=11)).grid(
                row=3, column=0, sticky="w", pady=(4, 0))
        if not compact and f.remediation:
            ctk.CTkLabel(head, text=f"\u2713 Fix: {f.remediation}",
                         text_color=COLORS["success"], anchor="w", wraplength=780,
                         justify="left", font=ctk.CTkFont(size=12)).grid(
                row=4, column=0, sticky="w", pady=(6, 0))
        self._attach_hover(row, base, COLORS["surface_3"])

    # --------------------------------------------------------- attack surface
    def _view_attack_surface(self) -> None:
        body = self._scroll_body()
        if not self.result or not self.result.attack_surface:
            self._placeholder(body, "No attack-surface entries. Run a scan first.")
            return
        for e in self.result.attack_surface:
            base = COLORS["surface_2"]
            row = ctk.CTkFrame(body, fg_color=base, corner_radius=12,
                               border_width=1, border_color=COLORS["border"])
            row.grid(row=body.grid_size()[1], column=0, sticky="ew", pady=4)
            row.grid_columnconfigure(1, weight=1)
            ctk.CTkLabel(row, text=f" {e.kind} ", fg_color=COLORS["accent_soft"],
                         text_color=COLORS["accent"], corner_radius=8,
                         font=ctk.CTkFont(size=11, weight="bold")).grid(
                row=0, column=0, padx=12, pady=12)
            info = ctk.CTkFrame(row, fg_color="transparent")
            info.grid(row=0, column=1, sticky="ew", pady=10)
            ctk.CTkLabel(info, text=e.name, text_color=COLORS["text"], anchor="w",
                         font=ctk.CTkFont(size=13, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(info, text=f"{e.detail}  \u00b7  {e.file}:{e.line}",
                         text_color=COLORS["muted"], anchor="w",
                         font=ctk.CTkFont(size=11)).pack(anchor="w")
            self._attach_hover(row, base, COLORS["surface_3"])

    # ----------------------------------------------------------- architecture
    def _view_architecture(self) -> None:
        wrapper = ctk.CTkFrame(self.content, fg_color="transparent")
        wrapper.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        wrapper.grid_columnconfigure(0, weight=1)
        wrapper.grid_rowconfigure(0, weight=1)

        if not self.result or not self.result.modules:
            self._placeholder(wrapper, "No architecture data. Run a scan first.")
            return

        canvas = ctk.CTkCanvas(wrapper, bg=COLORS["code_bg"], highlightthickness=1,
                               highlightbackground=COLORS["border"], bd=0)
        canvas.grid(row=0, column=0, sticky="nsew")
        canvas.bind("<Configure>", lambda _e: self._draw_graph(canvas))
        self.after(60, lambda: self._draw_graph(canvas))

    def _draw_graph(self, canvas) -> None:
        """Render an internal-dependency node graph on a Tk canvas."""
        if self.result is None or not canvas.winfo_exists():
            return
        canvas.delete("all")
        width = max(canvas.winfo_width(), 600)
        height = max(canvas.winfo_height(), 400)
        modules = [m.module or "(root)" for m in self.result.modules][:24]
        if not modules:
            return
        cx, cy = width / 2, height / 2
        positions: dict[str, tuple[float, float]] = {}
        n = len(modules)
        if n == 1:
            positions[modules[0]] = (cx, cy)
        else:
            radius = max(80.0, min(width, height) / 2 - 96)
            for i, m in enumerate(modules):
                angle = 2 * math.pi * i / n - math.pi / 2
                positions[m] = (cx + radius * math.cos(angle),
                                cy + radius * math.sin(angle))

        for dep in self.result.dependencies:
            if dep.external:
                continue
            src = dep.source or "(root)"
            dst = dep.target or "(root)"
            if src in positions and dst in positions and src != dst:
                x1, y1 = positions[src]
                x2, y2 = positions[dst]
                canvas.create_line(x1, y1, x2, y2, fill="#3B3B5C", width=1,
                                   smooth=True)

        for m, (x, y) in positions.items():
            canvas.create_oval(x - 13, y - 13, x + 13, y + 13,
                               fill=COLORS["accent_soft"], outline=COLORS["accent"],
                               width=2)
            canvas.create_oval(x - 4, y - 4, x + 4, y + 4, fill=COLORS["accent"],
                               outline="")
            canvas.create_text(x, y - 22, text=m, fill=COLORS["text_soft"],
                               font=("TkDefaultFont", 10, "bold"))
        canvas.create_text(
            16, 14, anchor="nw",
            text=f"\U0001F5FA  {n} modules  \u00b7  internal imports only",
            fill=COLORS["muted"], font=("TkDefaultFont", 11))

    # ------------------------------------------------------------ disassembler
    def _view_disassembler(self) -> None:
        wrapper = ctk.CTkFrame(self.content, fg_color="transparent")
        wrapper.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        wrapper.grid_columnconfigure(0, weight=1)
        wrapper.grid_rowconfigure(1, weight=1)

        hint = ctk.CTkFrame(wrapper, fg_color=COLORS["surface_2"], corner_radius=12)
        hint.grid(row=0, column=0, sticky="ew", pady=(0, 12))
        ctk.CTkLabel(hint, text="\U0001F9EE  Compiles source to a code object and "
                                "lists its bytecode. The target is never executed.",
                     text_color=COLORS["muted"], font=ctk.CTkFont(size=12)).pack(
            anchor="w", padx=16, pady=12)

        textbox = ctk.CTkTextbox(wrapper, fg_color=COLORS["code_bg"],
                                 text_color="#C4B5FD", font=("TkFixedFont", 12),
                                 border_width=1, border_color=COLORS["border"],
                                 wrap="none")
        textbox.grid(row=1, column=0, sticky="nsew")

        path = self.scan_target.get()
        target = path if os.path.isfile(path) else None
        if target is None:
            for p in self.result.modules if self.result else []:
                candidate = os.path.join(self.result.root, p.file)
                if os.path.isfile(candidate):
                    target = candidate
                    break
        if target is None:
            textbox.insert("end", "Select a .py file as the scan target to "
                                  "disassemble it.")
            return
        try:
            with open(target, encoding="utf-8", errors="replace") as fh:
                lines = list(disassemble(fh.read(), os.path.basename(target)))
            textbox.insert("end", "\n".join(lines))
        except (OSError, SyntaxError) as exc:
            textbox.insert("end", f"Could not disassemble {target}: {exc}")

    # ---------------------------------------------------------------- history
    def _view_history(self) -> None:
        body = self._scroll_body()
        rows = self.store.recent_scans()
        if not rows:
            self._placeholder(body, "No saved scans yet. Scans are stored "
                                    "automatically when you run them.")
            return
        for r in rows:
            base = COLORS["surface_2"]
            item = ctk.CTkFrame(body, fg_color=base, corner_radius=12,
                                border_width=1, border_color=COLORS["border"])
            item.grid(row=body.grid_size()[1], column=0, sticky="ew", pady=4)
            item.grid_columnconfigure(0, weight=1)
            ctk.CTkLabel(item, text=f"\U0001F553  #{r['id']}   {r['root']}",
                         text_color=COLORS["text"], anchor="w",
                         font=ctk.CTkFont(size=13, weight="bold")).grid(
                row=0, column=0, sticky="w", padx=14, pady=(12, 2))
            ctk.CTkLabel(
                item, anchor="w", text_color=COLORS["muted"],
                font=ctk.CTkFont(size=11),
                text=(f"{r['created_at']}  \u00b7  {r['files_scanned']} files  \u00b7  "
                      f"{r['total']} findings  "
                      f"(C{r['critical']} H{r['high']} M{r['medium']} "
                      f"L{r['low']} I{r['info']})")).grid(
                row=1, column=0, sticky="w", padx=14, pady=(0, 12))
            self._attach_hover(item, base, COLORS["surface_3"])

    # ------------------------------------------------------------- scan logic
    def _browse(self) -> None:
        path = filedialog.askdirectory(title="Select a folder to scan")
        if path:
            self.scan_target.set(path)

    def _set_status(self, text: str, color: str) -> None:
        self.status.configure(text=text, text_color=color)
        self.status_dot.configure(text_color=color)

    def _start_scan(self) -> None:
        if self._scanning:
            return
        target = self.scan_target.get().strip()
        if not target or not os.path.exists(target):
            self._set_status(f"Path not found: {target}", COLORS["danger"])
            return
        self._scanning = True
        self.scan_button.configure(state="disabled", text="Scanning\u2026")
        self._set_status("Starting scan\u2026", COLORS["warning"])
        threading.Thread(target=self._scan_worker, args=(target,), daemon=True).start()

    def _scan_worker(self, target: str) -> None:
        """Runs off the UI thread; communicates back only via the queue."""
        def progress(pct: int, current: str) -> None:
            self._events.put(("progress", pct, current))
        try:
            result = scan_path(target, progress=progress)
            try:
                self.store.save(result)
            except Exception as exc:  # persistence must never crash a scan
                self._events.put(("warn", f"Could not save scan: {exc}"))
            self._events.put(("done", result))
        except Exception as exc:  # defensive: surface any engine error in-UI
            self._events.put(("error", str(exc)))

    def _drain_events(self) -> None:
        try:
            while True:
                event = self._events.get_nowait()
                kind = event[0]
                if kind == "progress":
                    _, pct, current = event
                    self._set_status(f"[{pct}%] {current}", COLORS["warning"])
                elif kind == "warn":
                    self._set_status(event[1], COLORS["warning"])
                elif kind == "error":
                    self._scanning = False
                    self.scan_button.configure(state="normal", text="\u26A1  Scan")
                    self._set_status(f"Scan failed: {event[1]}", COLORS["danger"])
                elif kind == "done":
                    self.result = event[1]
                    self._scanning = False
                    self.scan_button.configure(state="normal", text="\u26A1  Scan")
                    total = len(self.result.findings)
                    self._set_status(
                        f"Done \u2713  {self.result.files_scanned} files \u00b7 "
                        f"{total} findings", COLORS["success"])
                    self._show("Dashboard")
        except queue.Empty:
            pass
        self.after(100, self._drain_events)


def launch() -> None:
    """Create and run the application."""
    app = AnalyzerApp()
    app.mainloop()
