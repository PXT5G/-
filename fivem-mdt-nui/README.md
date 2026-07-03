# FiveM MDT NUI — مثال تصميم (منفصل)

واجهة **NUI** Glassmorphism — **مرجع لتصميم FiveM** وليس جزءاً من نظام PlayStation.

| | PlayStation (الأساسي) | FiveM (هذا المجلد) |
|--|----------------------|---------------------|
| الواجهة | `mdt/` ويب | NUI داخل اللعبة |
| الباكند | `discord-bot/` | سيرفرك (ESX/QBCore) |
| الربط | ❌ لا يتصل ببعض | |

> بوت Discord في `discord-bot/` **مخصص لسوني فقط** — لا تربطه هنا.

## التثبيت

1. انسخ مجلد `fivem-mdt-nui` إلى `resources/[police]/mdt-nui`
2. أضف في `server.cfg`:
   ```
   ensure mdt-nui
   ```
3. أعد تشغيل السيرفر أو `refresh` + `ensure mdt-nui`

## الاستخدام في اللعبة

| الأمر / الزر | الوظيفة |
|--------------|---------|
| `/mdt` | فتح / إغلاق الواجهة |
| `F5` | اختصار فتح MDT |
| `ESC` | إغلاق |
| `Ctrl+K` | لوحة أوامر سريعة |

## هيكل الملفات

```
fivem-mdt-nui/
├── fxmanifest.lua          # تعريف المورد
├── client/
│   └── main.lua            # RegisterNUICallback + SendNUIMessage
└── html/
    ├── index.html          # الهيكلية
    ├── css/
    │   └── style.css       # Glassmorphism + animations
    └── js/
        ├── data.js         # بيانات تجريبية
        └── main.js         # المنطق + NUI bridge
```

## الربط مع Client (Lua)

### فتح الواجهة

```lua
-- من client.lua
SendNUIMessage({
    action = 'open',
    data = {
        officer = {
            name = 'James Carter',
            rank = 'Sergeant',
            department = 'LSPD',
            callsign = '1-L-12',
            onDuty = true,
        },
        job = 'police', -- police | ems | doj | fire
    },
})
SetNuiFocus(true, true)
```

### من السيرفر

```lua
TriggerClientEvent('mdt-nui:open', playerId, officerData)
TriggerClientEvent('mdt-nui:updateIncidents', playerId, incidentsTable)
TriggerClientEvent('mdt-nui:notify', playerId, 'عنوان', 'رسالة', 'success')
```

### استقبال من NUI (JavaScript → Lua)

```lua
RegisterNUICallback('searchCitizen', function(data, cb)
    local query = data.query
    -- استعلام سيرفر / Discord Bot
    cb({ ok = true, results = {...} })
end)
```

```javascript
// من main.js
const res = await postNui('searchCitizen', { query: 'Marcus', mode: 'name' });
```

## Framer Motion

FiveM CEF يعمل أفضل مع **CSS animations + Web Animations API** (مُطبّق في `main.js` و `style.css`).

للانتقال إلى Framer Motion:
1. أنشئ مشروع React + Vite + `framer-motion`
2. ابنِ إلى `html/` بنفس هيكل `postNui` و `onNuiMessage`
3. حدّث `ui_page` في `fxmanifest.lua`

## التطوير بدون FiveM

افتح `html/index.html` عبر خادم محلي — الواجهة تُفتح تلقائياً في وضع التطوير:

```bash
cd fivem-mdt-nui/html && npx serve .
```

## الربط مع Discord Bot API

استبدل الـ callbacks في `client/main.lua`:
- `searchCitizen` → طلب HTTP لبوت Discord
- `exportDiscord` → Webhook
- `processFine` → سجل الغرامات

## الواجهة الويب الكاملة (Next.js)

للنسخة الويب الكاملة مع لوحة إدارة ومصادقة، راجع مجلد `/mdt` في نفس المستودع.
