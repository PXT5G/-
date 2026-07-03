# نظام MDT المتقدم

مستودع يحتوي على نسختين:

| المجلد | الوصف |
|--------|--------|
| `mdt/` | تطبيق ويب Next.js (مصادقة، إدارة، DOJ) |
| `fivem-mdt-nui/` | واجهة NUI لـ FiveM |
| `discord-bot/` | **بوت Discord + REST API** — يربط الجميع |

## الربط الموحّد (بدون تعارض)

```
┌─────────────┐     ┌─────────────────┐     ┌──────────┐
│  MDT Web    │────►│  discord-bot    │────►│ Discord  │
│  (Next.js)  │     │  API :3921      │     │ Server   │
└─────────────┘     └────────▲────────┘     └──────────┘
┌─────────────┐              │
│  FiveM NUI  │──────────────┘
└─────────────┘
```

1. شغّل البوت: `cd discord-bot && npm install && npm start`
2. اضبط `mdt/.env.local`: `DISCORD_BOT_API_URL` + `DISCORD_BOT_API_SECRET`
3. اضبط FiveM: `set mdt_api_url` + `set mdt_api_secret`
4. ضع بوتك في `discord-bot/custom/index.js`

راجع `discord-bot/README.md` للتفاصيل.

## تشغيل الويب

```bash
cd mdt && npm install && npm run dev
```

## تثبيت FiveM NUI

```bash
# انسخ fivem-mdt-nui إلى resources ثم:
ensure mdt-nui
```

راجع `fivem-mdt-nui/README.md` للتفاصيل.

