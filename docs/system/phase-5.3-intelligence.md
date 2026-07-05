# Phase 5.3 — GULF Intelligence Layer (Complete)

## Applications

| Bundle | API Base |
|--------|----------|
| `com.gulfos.shortcuts` | `/api/shortcuts/*` |
| `com.gulfos.focus` | `/api/focus/*` |
| `com.gulfos.intelligence` | `/api/intelligence/*` |
| `com.gulfos.assistant` | `/api/assistant/*` |
| `com.gulfos.automation` | `/api/automation/*` |

## Shortcuts
- CRUD, run, history, action execution
- Models: `Shortcut`, `ShortcutHistory`
- Socket: `shortcut:run`, `shortcut:updated`, `shortcut:created`

## Focus Modes
- Profiles: work, sleep, driving, personal + custom
- Enable/disable, schedules, blocked apps
- Model: `FocusProfile`
- Socket: `focus:enabled`, `focus:disabled`, `focus:updated`

## Intelligence Hub
- **Predictions**: app usage, contacts, confidence scoring
- **Suggestions**: contextual action recommendations
- **Search Index 2.0**: indexed apps + global search categories
- **Smart Dashboards**: personal, bank, business, exchange, weather
- **Voice Engine**: session-based voice commands via Assistant
- **Background Optimization**: prediction + suggestion + index refresh

Models: `Prediction`, `Suggestion`, `SearchIndexEntry`, `SearchHistory`, `Dashboard`, `VoiceSession`

## Background Jobs
- `prediction-refresh` (15 min)
- `search-index-refresh` (30 min)
- `automation-scheduler` (60 sec)
- `assistant-cleanup` (1 hour)

## Socket Events
`prediction:generated`, `suggestion:generated`, `dashboard:update`, `search:index:update`, `shortcut:*`, `focus:*`
