"""Centralised visual design system (modern dark "cosmos" theme).

Inspired by contemporary dashboard/hosting-panel UI kits: a deep near-black
canvas, layered surface elevations, a violet->indigo accent gradient, generous
spacing and semantic severity colors. Keeping every token in one place enforces
a consistent, low-cognitive-load interface across all views.
"""

from __future__ import annotations

import tkinter as tk

# --- Color tokens -------------------------------------------------------------

COLORS = {
    # base backgrounds (dark -> elevated surfaces)
    "background": "#0A0A12",
    "background_alt": "#0D0D17",
    "surface": "#13131F",
    "surface_2": "#1A1A29",
    "surface_3": "#232338",
    "sidebar": "#0C0C15",

    # borders / hairlines
    "border": "#26263A",
    "border_light": "#343450",

    # brand accent (violet -> indigo gradient endpoints)
    "accent": "#8B5CF6",
    "accent_hover": "#7C3AED",
    "accent_soft": "#312255",
    "grad_start": "#7C3AED",
    "grad_end": "#4F46E5",
    "grad_cyan": "#22D3EE",

    # text
    "text": "#F4F4FB",
    "text_soft": "#C7C7DA",
    "muted": "#8A8AA6",

    # feedback
    "success": "#34D399",
    "warning": "#FBBF24",
    "danger": "#F87171",

    "code_bg": "#080810",
}

# Emoji glyphs used as lightweight navigation icons (no image assets needed).
NAV_ICONS = {
    "Dashboard": "\U0001F4CA",       # bar chart
    "Findings": "\U0001F6E1",        # shield
    "Attack Surface": "\U0001F310",  # globe
    "Architecture": "\U0001F5FA",    # map
    "Disassembler": "\U0001F9EE",    # abacus
    "History": "\U0001F553",         # clock
}

SEVERITY_ICONS = {
    "Critical": "\u26D4",
    "High": "\U0001F53A",
    "Medium": "\u25C6",
    "Low": "\u25B8",
    "Info": "\u2139",
}


# --- Gradient helpers ---------------------------------------------------------

def _hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def mix(color_a: str, color_b: str, t: float) -> str:
    """Linearly interpolate between two hex colors (t in [0, 1])."""
    a = _hex_to_rgb(color_a)
    b = _hex_to_rgb(color_b)
    return _rgb_to_hex(tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)))


def paint_horizontal_gradient(canvas: tk.Canvas, width: int, height: int,
                              start: str, end: str, steps: int = 96) -> None:
    """Draw a smooth left-to-right gradient onto ``canvas``.

    Uses a bounded number of vertical strips (``steps``) rather than one line
    per pixel, so the paint cost stays ``O(steps)`` regardless of window width
    -- cheap and memory-light even on constrained machines.
    """
    canvas.delete("gradient")
    if width <= 0 or height <= 0:
        return
    strip = max(1, width // steps)
    x = 0
    while x < width:
        t = x / max(width - 1, 1)
        canvas.create_rectangle(
            x, 0, x + strip + 1, height,
            fill=mix(start, end, t), outline="", tags="gradient")
        x += strip
    canvas.tag_lower("gradient")
