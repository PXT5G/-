#!/usr/bin/env python3
"""
TitanRE — Security Research & Reverse Engineering Framework
Entry point.

SKILL BREAKDOWN: Application Bootstrap / Defense in Depth
--------------------------------------------------------
The main module wires View (GUI) to Controller without importing engine
internals directly into the UI layer. This separation enforces MVC boundaries
so network or crypto modules can be audited independently of presentation
code — a maintainability practice rooted in least-privilege design.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure project root is importable when executed as ``python main.py``
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from gui.app import TitanREGui  # noqa: E402


def main() -> None:
    app = TitanREGui()
    app.run()


if __name__ == "__main__":
    main()
