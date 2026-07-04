"""Entry point for the Defensive Code Analysis Toolkit.

Two modes:

* GUI (default)::

      python main.py

* Headless CLI (no display required -- ideal for CI / servers)::

      python main.py --cli <path> [--json] [--save]

The CLI shares the exact same engine as the GUI, so results are identical.
"""

from __future__ import annotations

import argparse
import json
import sys

from core.models import Severity
from core.scanner import scan_path


def _run_cli(args: argparse.Namespace) -> int:
    def progress(pct: int, current: str) -> None:
        if not args.json:
            print(f"\r[{pct:3d}%] {current[:70]:<70}", end="", file=sys.stderr)

    result = scan_path(args.path, progress=progress if not args.json else None)
    if not args.json:
        print(file=sys.stderr)

    if args.save:
        from core.storage import ScanStore
        scan_id = ScanStore(args.db).save(result)
        if not args.json:
            print(f"Saved as scan #{scan_id} in {args.db}", file=sys.stderr)

    if args.json:
        payload = {
            "root": result.root,
            "files_scanned": result.files_scanned,
            "severity_counts": {
                s.label: c for s, c in result.severity_counts().items()
            },
            "findings": [
                {
                    "rule_id": f.rule_id, "title": f.title,
                    "severity": f.severity.label, "cwe": f.cwe,
                    "category": f.category, "file": f.file, "line": f.line,
                    "remediation": f.remediation,
                }
                for f in result.sorted_findings()
            ],
            "attack_surface": [
                {"kind": e.kind, "name": e.name, "file": e.file,
                 "line": e.line, "detail": e.detail}
                for e in result.attack_surface
            ],
            "errors": result.errors,
        }
        print(json.dumps(payload, indent=2))
        return 0

    counts = result.severity_counts()
    print(f"\nScanned {result.files_scanned} file(s) under {result.root}")
    print("Severity summary: " + ", ".join(
        f"{s.label}={counts[s]}" for s in reversed(Severity)))
    print("-" * 78)
    for f in result.sorted_findings():
        print(f"[{f.severity.label:>8}] {f.cwe:<9} {f.rule_id:<20} {f.file}:{f.line}")
        print(f"           {f.title}")
        if f.remediation:
            print(f"           fix: {f.remediation}")
    if result.attack_surface:
        print("-" * 78)
        print(f"Attack surface entries: {len(result.attack_surface)}")
        for e in result.attack_surface:
            print(f"  ({e.kind}) {e.name}  -> {e.file}:{e.line}")
    if result.errors:
        print("-" * 78)
        for err in result.errors:
            print(f"! {err}")
    # Non-zero exit if any HIGH/CRITICAL findings -- convenient for CI gating.
    high = counts[Severity.HIGH] + counts[Severity.CRITICAL]
    return 1 if high else 0


def _run_gui() -> int:
    from gui.main_window import launch
    launch()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Defensive Code Analysis Toolkit "
                    "(static weakness detection, attack-surface & architecture mapping).")
    parser.add_argument("--cli", action="store_true",
                        help="run a headless scan instead of launching the GUI")
    parser.add_argument("path", nargs="?", default=".",
                        help="file or directory to scan (CLI mode)")
    parser.add_argument("--json", action="store_true",
                        help="emit findings as JSON (CLI mode)")
    parser.add_argument("--save", action="store_true",
                        help="persist the scan to the SQLite database")
    parser.add_argument("--db", default="analysis_results.db",
                        help="SQLite database path (default: analysis_results.db)")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.cli:
        return _run_cli(args)
    return _run_gui()


if __name__ == "__main__":
    raise SystemExit(main())
