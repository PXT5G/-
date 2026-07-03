# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Python desktop tool: a **Defensive Code Analysis Toolkit** (static weakness
detection mapped to CWE, attack-surface mapping, architecture graph, and a safe
bytecode disassembler). The analysis engine lives in `core/` and depends only on
the Python standard library; the CustomTkinter GUI lives in `gui/`. Entry point:
`main.py`.

The tool is analytical/defensive only — it parses (never executes) the code it
analyzes. `sample_target/vulnerable_app.py` is a **benign fixture** of insecure
patterns used for demos and tests; expect the scanner to report findings on it.

### Running
- A virtualenv is created at `.venv` by the update script. Use `.venv/bin/python`.
- Headless CLI (no display): `.venv/bin/python main.py --cli sample_target`
  (add `--json` for machine output, `--save` to persist to SQLite). Exit code is
  `1` when any HIGH/CRITICAL findings exist — handy for CI gating.
- GUI needs an X display and the `python3-tk` system package (already installed
  in the snapshot). On this headless VM start a virtual display first:
  `Xvfb :99 -screen 0 1400x900x24 -ac &` then `export DISPLAY=:99` before
  `.venv/bin/python main.py`.

### Lint / test
- Lint: `.venv/bin/ruff check .`
- Tests: `.venv/bin/python -m pytest` (pure-stdlib engine tests; no display needed).

### Caveats
- `customtkinter` widgets do not respond to `xdotool` synthetic mouse events.
  For GUI-driven interaction, drive the engine directly or call view methods
  (e.g. `app._show(...)`) rather than simulating clicks.
- The SQLite DB (`analysis_results.db`) and its `-wal`/`-shm` sidecars are
  gitignored; they are created on first scan/save.
