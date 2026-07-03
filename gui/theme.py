"""Centralised visual tokens (dark theme).

Keeping colors in one place enforces a consistent, low-cognitive-load palette
and makes semantic severity mapping unambiguous across every view.
"""

from __future__ import annotations

COLORS = {
    "background": "#0F172A",     # slate-900
    "surface": "#1E293B",        # slate-800
    "surface_light": "#334155",  # slate-700
    "accent": "#2563EB",         # blue-600
    "accent_hover": "#1D4ED8",   # blue-700
    "text": "#F1F5F9",           # slate-100
    "muted": "#94A3B8",          # slate-400
    "border": "#334155",
    "code_bg": "#0B1220",
}

FONT_FAMILY = "TkDefaultFont"
MONO_FAMILY = "TkFixedFont"
