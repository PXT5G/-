# Discord Bot — باكند MDT لـ PlayStation RP

هذا البوت مخصص **لمجتمع السوني** الذي يستخدم **MDT Web** (`mdt/`).

**ليس** باكند لـ FiveM. مجلد `fivem-mdt-nui/` مثال منفصل ولا يتصل بهذا البوت.

## الدور

1. **REST API** — MDT Web يقرأ/يكتب البيانات (مواطنون، بلاغات، مذكرات، خدمة…)
2. **Discord** — أوامر slash، إشعارات، قنوات، تصدير لأعضاء السيرفر
3. **تخزين** — `data/store.json` (مصدر الحقيقة لمجتمع السوني)

```
MDT Web ──► discord-bot API ──► Discord Server
              (PlayStation RP)
```

## التثبيت

```bash
cd discord-bot
cp .env.example .env
# DISCORD_BOT_TOKEN — توكن بوت سيرفر السوني
# API_SECRET — مفتاح سري مشترك مع mdt/.env.local
npm install
npm start
```

## ربط MDT Web

`mdt/.env.local`:
```env
DISCORD_BOT_API_URL=http://127.0.0.1:3921
DISCORD_BOT_API_SECRET=نفس_قيمة_API_SECRET
```

عند النشر (Vercel/VPS): ضع URL البوت الحقيقي بدل `127.0.0.1`.

## دمج ملف بوتك (عندما تجلبه)

ضع منطق بوتك في `custom/index.js`:

```javascript
export default {
  async onReady({ client }) {
    // أوامرك الحالية، قنواتك، أحداثك
  },
  async onDuty({ entry, discordClient }) {
    // عند دخول/خروج خدمة من MDT Web
  },
  async onExport({ type, data, officer, discordClient }) {
    // إرسال مذكرة/تقرير لقناة أو DM
  },
  extendApi({ api }) {
    // مسارات API إضافية إن احتجت
  },
};
```

**قواعد لتجنب التعارض:**
- لا تشغّل `client.login()` في `custom/` — النظام يفعل ذلك
- لا تفتح منفذ API ثانٍ — استخدم `extendApi`
- البيانات المشتركة عبر `store/json-store.js` أو API

## API

| Method | Path | الاستخدام |
|--------|------|-----------|
| GET | `/api/citizens/search` | بحث DOJ |
| GET | `/api/citizens/:id` | ملف مواطن |
| GET | `/api/incidents` | بلاغات |
| GET | `/api/warrants` | مذكرات |
| POST | `/api/duty` | سجل خدمة |
| POST | `/api/export` | تصدير Discord |
| POST | `/api/fines` | غرامة |

مصادقة: `Authorization: Bearer <API_SECRET>`

## أوامر Discord (افتراضية)

- `/search` — بحث مواطن
- `/warrants` — مذكرات
- `/dispatch` — بلاغات
- `/mdt` — رابط/معلومات الويب

يمكنك استبدالها أو إضافتها من `custom/index.js` عبر `onInteraction`.

## بدون البوت

MDT Web يعمل ببيانات تجريبية محلية — مفيد للتطوير قبل ربط بوتك.
