# Police MDT — FiveM Roleplay Mobile Data Terminal

Next.js frontend for a PlayStation GTA V RP community. Backend data is intended to flow through a **Discord Bot** (API / webhooks) — no in-game server scripts required.

## Stack

- **Next.js** (App Router)
- **Tailwind CSS** (tactical dark theme)
- **Lucide React** icons

## Run locally

```bash
cd mdt
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Modules

| Route | Module |
|-------|--------|
| `/` | Dashboard — bulletin, reports, warrants, units, BOLOs |
| `/dispatch` | Dispatch center — units/channels, map, incidents |
| `/officers` | Officers management grid |
| `/reports/[id]` | Reports & evidence locker (tabbed) |

Other sidebar routes are scaffolded placeholders ready for Discord Bot API wiring.

## Arabic / i18n

All UI strings live in `src/lib/i18n/messages.ts`. To localize:

1. Duplicate `messages` as `messagesAr` (or load from JSON).
2. Set `<html lang="ar" dir="rtl">` in `src/app/layout.tsx`.
3. Swap the `t()` resolver to use the Arabic catalog.

## Discord integration

Search the codebase for `Discord Bot API` and `Discord Webhook` comments — they mark fetch/update points for inventory, logs, fines, and roster data.
