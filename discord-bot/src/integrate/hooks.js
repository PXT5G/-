/**
 * ═══════════════════════════════════════════════════════════════
 * hooks.js — ربط بوتك المخصص بدون تعارض
 * ═══════════════════════════════════════════════════════════════
 *
 * ضع ملفك في: discord-bot/custom/index.js
 *
 * مثال custom/index.js:
 *
 *   export default {
 *     async onReady({ client }) {
 *       // كود بوتك الحالي عند الجاهزية
 *     },
 *     async onDuty({ entry, discordClient }) {
 *       // عند تبديل الخدمة من MDT
 *     },
 *     extendApi({ api, discordClient }) {
 *       api.get('/my-route', (req, res) => res.json({ ok: true }));
 *     },
 *   };
 */

let customModule = null;

async function loadCustom() {
  if (customModule !== null) return customModule;
  try {
    customModule = await import('../../custom/index.js');
    console.log('[integrate] Custom bot module loaded');
  } catch {
    customModule = false;
    console.log('[integrate] No custom/index.js — using defaults only');
  }
  return customModule;
}

export async function runCustomHook(hookName, context) {
  const mod = await loadCustom();
  if (!mod || mod === false) return;
  const handler = mod.default?.[hookName] ?? mod[hookName];
  if (typeof handler === 'function') {
    try {
      await handler(context);
    } catch (err) {
      console.error(`[integrate] Hook ${hookName} error:`, err);
    }
  }
}
