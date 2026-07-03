# Defensive Code Analysis Toolkit

A lightweight, **defensive / analytical** security tool for Python codebases. It
statically detects common weaknesses, maps a project's attack surface, visualises
its module architecture, and disassembles bytecode — all **without ever executing
the code under analysis**.

> Scope: this is a white-hat *detect, dissect, understand & document* tool. It
> does **not** generate exploits, shellcode, malware, or evasion code.

## Features

- **Static weakness detector** (`core/vuln_analyzer.py`) — AST-based rules mapped
  to CWE identifiers: code/command injection, insecure deserialization, weak
  crypto, SQL injection, hard-coded secrets, disabled TLS verification, insecure
  file permissions, and more.
- **Attack-surface mapper** (`core/attack_surface.py`) — enumerates HTTP routes,
  network binds, CLI/stdin inputs and environment reads.
- **Architecture mapper** (`core/architecture.py`) — module structure + an
  internal import-dependency graph, rendered as a node graph in the GUI.
- **Safe bytecode disassembler** (`core/disassembler.py`) — uses the stdlib
  `dis` module; compiles but never runs the target.
- **SQLite (WAL) history** (`core/storage.py`) — scans are persisted for review.
- **CustomTkinter GUI** (`gui/`) — dark theme, semantic severity colors,
  non-blocking background scans.

The analysis **engine depends only on the Python standard library**
(`ast`, `dis`, `sqlite3`, `tkinter`); `customtkinter` is only needed for the GUI.

## Requirements

- Python 3.10+
- System package `python3-tk` (Tkinter) for the GUI
- `pip install -r requirements.txt` (GUI) or `-r requirements-dev.txt` (tests+lint)

## Usage

### GUI

```bash
python main.py
```

Enter a path, press **Scan**, then explore the Dashboard, Findings, Attack
Surface, Architecture, Disassembler and History views.

### Headless CLI (no display needed)

```bash
# Human-readable report (exit code 1 if any HIGH/CRITICAL findings)
python main.py --cli path/to/project

# Machine-readable JSON
python main.py --cli path/to/project --json

# Persist the run to the SQLite database
python main.py --cli path/to/project --save
```

## Development

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
ruff check .        # lint
pytest              # tests
```

`sample_target/vulnerable_app.py` is a **benign test fixture** containing
well-known insecure patterns so the detector has something to find.
