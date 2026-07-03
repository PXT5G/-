"""Main application window (CustomTkinter).

Architecture (MVVM-ish separation of concerns):

* The **engine** (``core``) does all analysis and knows nothing about the UI.
* This module is the **view**: it renders state and forwards user intent.
* Scans run on a **background thread**; results are handed back to the Tk main
  loop through a :class:`queue.Queue` that is polled with ``after`` so the UI
  never blocks (non-blocking micro-interaction feedback).
"""

from __future__ import annotations

import os
import queue
import threading
from tkinter import filedialog

import customtkinter as ctk

from core.disassembler import disassemble
from core.models import ScanResult, Severity
from core.scanner import scan_path
from core.storage import ScanStore
from gui.theme import COLORS


class AnalyzerApp(ctk.CTk):
    """Top-level window for the defensive code analysis toolkit."""

    NAV_ITEMS = ("Dashboard", "Findings", "Attack Surface",
                 "Architecture", "Disassembler", "History")

    def __init__(self) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("Defensive Code Analysis Toolkit")
        self.geometry("1180x760")
        self.minsize(1000, 660)
        self.configure(fg_color=COLORS["background"])

        self.store = ScanStore()
        self.result: ScanResult | None = None
        self._events: queue.Queue = queue.Queue()
        self._scanning = False
        self.scan_target = ctk.StringVar(value=os.path.abspath("sample_target"))

        self._build_layout()
        self._show("Dashboard")
        self.after(100, self._drain_events)

    # ------------------------------------------------------------------ layout
    def _build_layout(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self._build_sidebar()
        self._build_topbar()

        self.content = ctk.CTkFrame(self, fg_color=COLORS["surface"],
                                    corner_radius=16, border_width=1,
                                    border_color=COLORS["border"])
        self.content.grid(row=1, column=1, sticky="nsew", padx=(0, 20), pady=(0, 20))
        self.content.grid_columnconfigure(0, weight=1)
        self.content.grid_rowconfigure(0, weight=1)

    def _build_sidebar(self) -> None:
        sidebar = ctk.CTkFrame(self, width=220, corner_radius=0,
                               fg_color=COLORS["surface"])
        sidebar.grid(row=0, column=0, rowspan=2, sticky="nsew")
        sidebar.grid_propagate(False)

        ctk.CTkLabel(sidebar, text="DEFENSIVE\nANALYZER",
                     font=ctk.CTkFont(size=18, weight="bold"),
                     text_color=COLORS["text"], justify="left").grid(
            row=0, column=0, padx=24, pady=(28, 8), sticky="w")
        ctk.CTkLabel(sidebar, text="static • attack surface • architecture",
                     font=ctk.CTkFont(size=11), text_color=COLORS["muted"]).grid(
            row=1, column=0, padx=24, pady=(0, 24), sticky="w")

        self.nav_buttons: dict[str, ctk.CTkButton] = {}
        for i, item in enumerate(self.NAV_ITEMS, start=2):
            btn = ctk.CTkButton(
                sidebar, text=item, height=42, corner_radius=10, anchor="w",
                fg_color="transparent", hover_color=COLORS["surface_light"],
                font=ctk.CTkFont(size=14, weight="bold"),
                command=lambda name=item: self._show(name))
            btn.grid(row=i, column=0, padx=16, pady=5, sticky="ew")
            self.nav_buttons[item] = btn
        sidebar.grid_columnconfigure(0, weight=1)

    def _build_topbar(self) -> None:
        bar = ctk.CTkFrame(self, height=88, fg_color=COLORS["background"])
        bar.grid(row=0, column=1, sticky="ew", padx=(0, 20), pady=(20, 12))
        bar.grid_columnconfigure(0, weight=1)
        bar.grid_propagate(False)

        entry = ctk.CTkEntry(bar, textvariable=self.scan_target, height=40,
                             placeholder_text="Path to scan…",
                             fg_color=COLORS["surface"], border_color=COLORS["border"])
        entry.grid(row=0, column=0, sticky="ew", padx=(0, 10), pady=8)

        ctk.CTkButton(bar, text="Browse", width=90, height=40,
                      fg_color=COLORS["surface_light"], hover_color=COLORS["border"],
                      command=self._browse).grid(row=0, column=1, padx=6, pady=8)
        self.scan_button = ctk.CTkButton(
            bar, text="Scan", width=120, height=40, fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], font=ctk.CTkFont(weight="bold"),
            command=self._start_scan)
        self.scan_button.grid(row=0, column=2, padx=(6, 0), pady=8)

        self.status = ctk.CTkLabel(bar, text="Ready.", text_color=COLORS["muted"],
                                   font=ctk.CTkFont(size=12))
        self.status.grid(row=1, column=0, columnspan=3, sticky="w")

    # ------------------------------------------------------------- navigation
    def _show(self, name: str) -> None:
        for item, btn in self.nav_buttons.items():
            btn.configure(fg_color=COLORS["accent"] if item == name else "transparent")
        for child in self.content.winfo_children():
            child.destroy()
        renderer = {
            "Dashboard": self._view_dashboard,
            "Findings": self._view_findings,
            "Attack Surface": self._view_attack_surface,
            "Architecture": self._view_architecture,
            "Disassembler": self._view_disassembler,
            "History": self._view_history,
        }[name]
        renderer()

    def _scroll_body(self) -> ctk.CTkScrollableFrame:
        body = ctk.CTkScrollableFrame(self.content, fg_color="transparent")
        body.grid(row=0, column=0, sticky="nsew", padx=18, pady=18)
        body.grid_columnconfigure(0, weight=1)
        return body

    @staticmethod
    def _heading(parent, text: str) -> None:
        ctk.CTkLabel(parent, text=text, font=ctk.CTkFont(size=20, weight="bold"),
                     text_color=COLORS["text"]).grid(
            row=parent.grid_size()[1], column=0, sticky="w", pady=(0, 14))

    @staticmethod
    def _placeholder(parent, text: str) -> None:
        ctk.CTkLabel(parent, text=text, text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=13)).grid(
            row=parent.grid_size()[1], column=0, sticky="w", pady=8)

    # -------------------------------------------------------------- dashboard
    def _view_dashboard(self) -> None:
        body = self._scroll_body()
        self._heading(body, "Dashboard")
        if self.result is None:
            self._placeholder(body, "No scan yet. Choose a path above and press "
                                    "Scan to analyze a codebase.")
            return

        counts = self.result.severity_counts()
        cards = ctk.CTkFrame(body, fg_color="transparent")
        cards.grid(row=1, column=0, sticky="ew")
        for i in range(5):
            cards.grid_columnconfigure(i, weight=1, uniform="m")
        metrics = [("Critical", counts[Severity.CRITICAL], Severity.CRITICAL.color),
                   ("High", counts[Severity.HIGH], Severity.HIGH.color),
                   ("Medium", counts[Severity.MEDIUM], Severity.MEDIUM.color),
                   ("Low", counts[Severity.LOW], Severity.LOW.color),
                   ("Info", counts[Severity.INFO], Severity.INFO.color)]
        for col, (label, value, color) in enumerate(metrics):
            self._metric_card(cards, col, label, value, color)

        summary = ctk.CTkFrame(body, fg_color=COLORS["surface_light"],
                               corner_radius=12)
        summary.grid(row=2, column=0, sticky="ew", pady=(18, 0))
        summary.grid_columnconfigure((0, 1, 2), weight=1)
        stats = [("Files scanned", self.result.files_scanned),
                 ("Total findings", len(self.result.findings)),
                 ("Attack surface", len(self.result.attack_surface)),
                 ("Modules", len(self.result.modules)),
                 ("Dependencies", len(self.result.dependencies)),
                 ("Parse errors", len(self.result.errors))]
        for i, (label, value) in enumerate(stats):
            box = ctk.CTkFrame(summary, fg_color="transparent")
            box.grid(row=i // 3, column=i % 3, sticky="ew", padx=18, pady=14)
            ctk.CTkLabel(box, text=str(value), text_color=COLORS["text"],
                         font=ctk.CTkFont(size=24, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(box, text=label, text_color=COLORS["muted"],
                         font=ctk.CTkFont(size=12)).pack(anchor="w")

    def _metric_card(self, parent, col, label, value, color) -> None:
        card = ctk.CTkFrame(parent, fg_color=COLORS["surface_light"], corner_radius=12)
        card.grid(row=0, column=col, padx=6, pady=6, sticky="nsew")
        ctk.CTkLabel(card, text=str(value), text_color=color,
                     font=ctk.CTkFont(size=30, weight="bold")).pack(
            anchor="w", padx=16, pady=(14, 0))
        ctk.CTkLabel(card, text=label.upper(), text_color=COLORS["muted"],
                     font=ctk.CTkFont(size=12, weight="bold")).pack(
            anchor="w", padx=16, pady=(0, 14))

    # --------------------------------------------------------------- findings
    def _view_findings(self) -> None:
        body = self._scroll_body()
        self._heading(body, "Findings")
        if not self.result or not self.result.findings:
            self._placeholder(body, "No findings to display. Run a scan first.")
            return
        for f in self.result.sorted_findings():
            self._finding_row(body, f)

    def _finding_row(self, parent, f) -> None:
        row = ctk.CTkFrame(parent, fg_color=COLORS["surface_light"], corner_radius=10)
        row.grid(row=parent.grid_size()[1], column=0, sticky="ew", pady=5)
        row.grid_columnconfigure(1, weight=1)

        badge = ctk.CTkLabel(row, text=f" {f.severity.label.upper()} ",
                             fg_color=f.severity.color, text_color="#0B1220",
                             corner_radius=6, font=ctk.CTkFont(size=11, weight="bold"))
        badge.grid(row=0, column=0, padx=14, pady=14, sticky="nw")

        head = ctk.CTkFrame(row, fg_color="transparent")
        head.grid(row=0, column=1, sticky="ew", padx=(0, 14), pady=(12, 12))
        head.grid_columnconfigure(0, weight=1)
        ctk.CTkLabel(head, text=f.title, text_color=COLORS["text"], anchor="w",
                     font=ctk.CTkFont(size=14, weight="bold")).grid(
            row=0, column=0, sticky="w")
        ctk.CTkLabel(head, text=f"{f.cwe} · {f.rule_id} · {f.category}",
                     text_color=COLORS["muted"], anchor="w",
                     font=ctk.CTkFont(size=11)).grid(row=1, column=0, sticky="w")
        ctk.CTkLabel(head, text=f"{f.file}:{f.line}", text_color=COLORS["accent"],
                     anchor="w", font=ctk.CTkFont(size=12)).grid(
            row=2, column=0, sticky="w", pady=(2, 0))
        if f.snippet:
            ctk.CTkLabel(head, text=f.snippet, text_color=COLORS["muted"],
                         anchor="w", font=ctk.CTkFont(family="TkFixedFont", size=11)).grid(
                row=3, column=0, sticky="w", pady=(4, 0))
        if f.remediation:
            ctk.CTkLabel(head, text=f"Fix: {f.remediation}", text_color="#86EFAC",
                         anchor="w", wraplength=760, justify="left",
                         font=ctk.CTkFont(size=12)).grid(
                row=4, column=0, sticky="w", pady=(4, 0))

    # --------------------------------------------------------- attack surface
    def _view_attack_surface(self) -> None:
        body = self._scroll_body()
        self._heading(body, "Attack Surface")
        if not self.result or not self.result.attack_surface:
            self._placeholder(body, "No attack-surface entries. Run a scan first.")
            return
        for e in self.result.attack_surface:
            row = ctk.CTkFrame(body, fg_color=COLORS["surface_light"], corner_radius=10)
            row.grid(row=body.grid_size()[1], column=0, sticky="ew", pady=4)
            row.grid_columnconfigure(1, weight=1)
            ctk.CTkLabel(row, text=f" {e.kind} ", fg_color=COLORS["accent"],
                         text_color="#0B1220", corner_radius=6,
                         font=ctk.CTkFont(size=11, weight="bold")).grid(
                row=0, column=0, padx=12, pady=12)
            info = ctk.CTkFrame(row, fg_color="transparent")
            info.grid(row=0, column=1, sticky="ew", pady=10)
            ctk.CTkLabel(info, text=e.name, text_color=COLORS["text"], anchor="w",
                         font=ctk.CTkFont(size=13, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(info, text=f"{e.detail}  ({e.file}:{e.line})",
                         text_color=COLORS["muted"], anchor="w",
                         font=ctk.CTkFont(size=11)).pack(anchor="w")

    # ----------------------------------------------------------- architecture
    def _view_architecture(self) -> None:
        self.content.grid_rowconfigure(0, weight=1)
        wrapper = ctk.CTkFrame(self.content, fg_color="transparent")
        wrapper.grid(row=0, column=0, sticky="nsew", padx=18, pady=18)
        wrapper.grid_columnconfigure(0, weight=1)
        wrapper.grid_rowconfigure(1, weight=1)
        ctk.CTkLabel(wrapper, text="Architecture", text_color=COLORS["text"],
                     font=ctk.CTkFont(size=20, weight="bold")).grid(
            row=0, column=0, sticky="w", pady=(0, 14))

        if not self.result or not self.result.modules:
            ctk.CTkLabel(wrapper, text="No architecture data. Run a scan first.",
                         text_color=COLORS["muted"]).grid(row=1, column=0, sticky="nw")
            return

        canvas = ctk.CTkCanvas(wrapper, bg=COLORS["code_bg"], highlightthickness=0)
        canvas.grid(row=1, column=0, sticky="nsew")
        self.after(60, lambda: self._draw_graph(canvas))

    def _draw_graph(self, canvas) -> None:
        """Render a simple internal-dependency node graph on a Tk canvas."""
        if self.result is None:
            return
        canvas.delete("all")
        width = max(canvas.winfo_width(), 600)
        modules = [m.module for m in self.result.modules][:24]
        if not modules:
            return
        import math
        cx, cy = width / 2, 300
        radius = min(width, 620) / 2 - 80
        positions: dict[str, tuple[float, float]] = {}
        n = len(modules)
        for i, m in enumerate(modules):
            angle = 2 * math.pi * i / n
            positions[m] = (cx + radius * math.cos(angle),
                            cy + radius * math.sin(angle))

        for dep in self.result.dependencies:
            if dep.external:
                continue
            src, dst = dep.source, dep.target
            if src in positions and dst in positions:
                x1, y1 = positions[src]
                x2, y2 = positions[dst]
                canvas.create_line(x1, y1, x2, y2, fill="#334155", width=1)

        for m, (x, y) in positions.items():
            canvas.create_oval(x - 6, y - 6, x + 6, y + 6, fill=COLORS["accent"],
                               outline="")
            canvas.create_text(x, y - 14, text=m or "(root)",
                               fill=COLORS["text"], font=("TkDefaultFont", 9))
        canvas.create_text(10, 10, anchor="nw",
                           text=f"{len(modules)} modules · internal imports only",
                           fill=COLORS["muted"], font=("TkDefaultFont", 10))

    # ------------------------------------------------------------ disassembler
    def _view_disassembler(self) -> None:
        wrapper = ctk.CTkFrame(self.content, fg_color="transparent")
        wrapper.grid(row=0, column=0, sticky="nsew", padx=18, pady=18)
        wrapper.grid_columnconfigure(0, weight=1)
        wrapper.grid_rowconfigure(2, weight=1)
        ctk.CTkLabel(wrapper, text="Bytecode Disassembler", text_color=COLORS["text"],
                     font=ctk.CTkFont(size=20, weight="bold")).grid(
            row=0, column=0, sticky="w", pady=(0, 6))
        ctk.CTkLabel(wrapper, text="Compiles source to a code object and lists its "
                                   "bytecode. The target is never executed.",
                     text_color=COLORS["muted"], font=ctk.CTkFont(size=12)).grid(
            row=1, column=0, sticky="w", pady=(0, 12))

        textbox = ctk.CTkTextbox(wrapper, fg_color=COLORS["code_bg"],
                                 text_color="#D1FAE5", font=("TkFixedFont", 12),
                                 wrap="none")
        textbox.grid(row=2, column=0, sticky="nsew")

        path = self.scan_target.get()
        target = path if os.path.isfile(path) else None
        if target is None:
            for p in self.result.modules if self.result else []:
                if os.path.isfile(os.path.join(self.result.root, p.file)):
                    target = os.path.join(self.result.root, p.file)
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
        self._heading(body, "Scan History")
        rows = self.store.recent_scans()
        if not rows:
            self._placeholder(body, "No saved scans yet. Scans are stored "
                                    "automatically when you run them.")
            return
        for r in rows:
            item = ctk.CTkFrame(body, fg_color=COLORS["surface_light"], corner_radius=10)
            item.grid(row=body.grid_size()[1], column=0, sticky="ew", pady=4)
            item.grid_columnconfigure(0, weight=1)
            ctk.CTkLabel(item, text=f"#{r['id']}  {r['root']}",
                         text_color=COLORS["text"], anchor="w",
                         font=ctk.CTkFont(size=13, weight="bold")).grid(
                row=0, column=0, sticky="w", padx=14, pady=(12, 0))
            ctk.CTkLabel(
                item, anchor="w", text_color=COLORS["muted"],
                font=ctk.CTkFont(size=11),
                text=(f"{r['created_at']} · {r['files_scanned']} files · "
                      f"{r['total']} findings "
                      f"(C{r['critical']}/H{r['high']}/M{r['medium']}/"
                      f"L{r['low']}/I{r['info']})")).grid(
                row=1, column=0, sticky="w", padx=14, pady=(0, 12))

    # ------------------------------------------------------------- scan logic
    def _browse(self) -> None:
        path = filedialog.askdirectory(title="Select a folder to scan")
        if path:
            self.scan_target.set(path)

    def _start_scan(self) -> None:
        if self._scanning:
            return
        target = self.scan_target.get().strip()
        if not target or not os.path.exists(target):
            self.status.configure(text=f"Path not found: {target}", text_color="#F87171")
            return
        self._scanning = True
        self.scan_button.configure(state="disabled", text="Scanning…")
        self.status.configure(text="Starting scan…", text_color=COLORS["muted"])
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
                    self.status.configure(
                        text=f"[{pct}%] {current}", text_color=COLORS["muted"])
                elif kind == "warn":
                    self.status.configure(text=event[1], text_color="#FBBF24")
                elif kind == "error":
                    self._scanning = False
                    self.scan_button.configure(state="normal", text="Scan")
                    self.status.configure(text=f"Scan failed: {event[1]}",
                                          text_color="#F87171")
                elif kind == "done":
                    self.result = event[1]
                    self._scanning = False
                    self.scan_button.configure(state="normal", text="Scan")
                    total = len(self.result.findings)
                    self.status.configure(
                        text=f"Done: {self.result.files_scanned} files, "
                             f"{total} findings.", text_color="#86EFAC")
                    self._show("Dashboard")
        except queue.Empty:
            pass
        self.after(100, self._drain_events)


def launch() -> None:
    """Create and run the application."""
    app = AnalyzerApp()
    app.mainloop()
