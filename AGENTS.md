# AGENTS.md

## Cursor Cloud specific instructions

### Overview
This is a Python desktop GUI application ("Automation Control Center") built with CustomTkinter and Playwright. It manages browser-based E2E test automation against staging/sandbox URLs. Entry point: `python main.py`.

### Running the app
- Requires a display server. Start Xvfb before launching: `Xvfb :99 -screen 0 1920x1080x24 -ac &` then `export DISPLAY=:99`.
- Launch with `python3 main.py` from the workspace root.
- The app opens a 1100x700 window with a dark-themed dashboard.

### Dependencies
- See `requirements.txt` for pip packages (`customtkinter`, `playwright`).
- `python3-tk` system package is required (not bundled with the base Python install).
- After installing pip packages, run `python3 -m playwright install chromium` to download the Chromium binary.

### Linting
- `ruff check .` passes cleanly.
- `pyright .` reports pre-existing type errors in `browser_engine.py` (dict/object kwargs passed to Playwright's typed API) and one in `main.py`. These are not regressions.

### Known caveats
- CustomTkinter widgets do not respond to `xdotool` synthetic mouse events. For GUI-driven testing, use Playwright or direct tkinter event injection instead.
- The app reads optional data files (`accounts.txt`, `cards.txt`, `proxies.txt`, `config.json`) from the working directory. These are gitignored. Create them for E2E scenarios.
- External API keys (5sim, CapSolver) are optional and only used for health-check features; the app runs fine without them.
