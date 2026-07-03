# نظام MDT المتقدم — PlayStation RP

مشروع **MDT ويب** لمجتمعات الـ RP على **PlayStation** — لا يوجد سكربت سيرفر داخل اللعبة، لذلك الباكند عبر **بوت Discord**.

## المكونات

| المجلد | الاستخدام | ملاحظة |
|--------|-----------|--------|
| **`mdt/`** | واجهة الويب للعسكريين | **المنتج الرئيسي** |
| **`discord-bot/`** | باكند البيانات + Discord | **يربط مع MDT Web فقط** |
| `fivem-mdt-nui/` | مثال واجهة NUI | **اختياري** — لسيرفرات FiveM، **غير مربوط** بالبوت |

## المعمارية (PlayStation)

```
العسكري (متصفح / جوال)
        │
        ▼
   MDT Web (mdt/)
        │  REST API
        ▼
  discord-bot (:3921)
        │
        ▼
   سيرفر Discord
   (أوامر، قنوات، DM، سجلات)
```

- **لا FiveM** في هذا المسار
- البوت = قاعدة البيانات + أوامر Discord لمجتمع السوني
- MDT Web يعمل حتى لو البوت مطفّى (بيانات تجريبية مؤقتاً)

## التشغيل السريع

### 1. البوت (باكند السوني)
```bash
cd discord-bot
cp .env.example .env
npm install
npm start
```

### 2. MDT Web
```bash
cd mdt
cp .env.example .env.local
npm install
npm run dev
```

في `.env.local`:
```env
DISCORD_BOT_API_URL=http://127.0.0.1:3921
DISCORD_BOT_API_SECRET=نفس_API_SECRET_في_البوت
```

### 3. دمج بوتك
عندما تجلب ملف البوت، ضعه في:
`discord-bot/custom/index.js`

---

## FiveM (مثال منفصل فقط)

مجلد `fivem-mdt-nui/` مرجع لتصميم NUI — **لا يستخدم بوت PlayStation**.
إن احتجته لسيرفر FiveM، اربطه بسيرفرك (ESX/QBCore) وليس بـ `discord-bot/`.

راجع `fivem-mdt-nui/README.md`.
