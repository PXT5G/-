# Discord Bot — مركز الربط لـ MDT

**مصدر بيانات واحد** يربط:
- `mdt/` — تطبيق الويب (Next.js)
- `fivem-mdt-nui/` — واجهة FiveM
- Discord — أوامر slash + قنوات

**بدون تعارض:** كل خدمة تعمل في عملية منفصلة وتتواصل عبر REST API فقط.

## الهيكل

```
discord-bot/
├── src/
│   ├── index.js           # تشغيل البوت + API
│   ├── api/server.js      # REST API
│   ├── bot/discord-client.js
│   ├── store/json-store.js  # قاعدة بيانات JSON
│   └── integrate/hooks.js   # ربط بوتك المخصص
├── custom/
│   └── index.js           # ← ضع ملف بوتك هنا
├── data/seed.json
└── .env
```

## التثبيت

```bash
cd discord-bot
cp .env.example .env
# عدّل DISCORD_BOT_TOKEN و API_SECRET
npm install
npm start
```

الـ API يعمل على: `http://127.0.0.1:3921`

## ربط MDT Web

في `mdt/.env.local`:

```env
DISCORD_BOT_API_URL=http://127.0.0.1:3921
DISCORD_BOT_API_SECRET=نفس_القيمة_في_discord-bot
```

## ربط FiveM

في `server.cfg`:

```cfg
set mdt_api_url "http://127.0.0.1:3921"
set mdt_api_secret "نفس_API_SECRET"
ensure mdt-nui
```

## API Endpoints

| Method | Path | الوصف |
|--------|------|--------|
| GET | `/health` | فحص الحالة |
| GET | `/api/citizens/search?q=&mode=` | بحث مواطن |
| GET | `/api/citizens/:id` | ملف مواطن |
| GET | `/api/incidents` | البلاغات |
| GET | `/api/warrants` | المذكرات |
| POST | `/api/duty` | سجل خدمة |
| POST | `/api/export` | تصدير Discord |
| POST | `/api/fines` | غرامة |

**المصادقة:** `Authorization: Bearer <API_SECRET>`

## دمج بوتك الحالي

1. افتح `custom/index.js`
2. انسخ منطق بوتك إلى الـ hooks (لا تستدعِ `client.login` — النظام يفعل ذلك)

```javascript
export default {
  async onReady({ client }) {
    // كود بوتك عند التشغيل
  },
  async onDuty({ entry, discordClient }) {
    // عند تبديل الخدمة من MDT
  },
  extendApi({ api }) {
    api.get('/my/custom', (req, res) => res.json({ ok: true }));
  },
};
```

## أوامر Discord

- `/search` — بحث مواطن
- `/warrants` — مذكرات نشطة
- `/dispatch` — بلاغات
- `/mdt` — معلومات النظام

## Fallback بدون البوت

إذا البوت غير مشغّل:
- MDT Web يستخدم البيانات المحلية (mock)
- FiveM يستخدم بيانات تجريبية

لا يحدث تعارض أو تعطّل.
