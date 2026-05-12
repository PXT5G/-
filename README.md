# Automation Control Center

A modern desktop dashboard built with Python and CustomTkinter for monitoring and managing automation tasks.

## Prerequisites

- Python 3.10+ (with Tkinter support)
- On **Ubuntu/Debian**: `sudo apt-get install python3-tk`
- On **macOS**: Tkinter ships with the official python.org installer
- On **Windows**: Tkinter is included with the standard Python installer

## Setup

```bash
pip install -r requirements.txt
python main.py
```

## Views

| View | Description |
|------|-------------|
| **Home** | Overview with Success, Failed, and Active Threads stat cards |
| **Credentials** | Form for storing service credentials |
| **Task Manager** | Scrollable list of automation tasks with status indicators |
| **Live Logs** | Scrollable real-time log console with auto-scroll |
