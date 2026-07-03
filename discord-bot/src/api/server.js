import express from 'express';
import { apiAuth } from './auth.js';
import {
  searchCitizens,
  getCitizenById,
  getIncidents,
  getWarrants,
  getBulletins,
  getUnits,
  addDutyLog,
  appendAudit,
  getStore,
} from '../store/json-store.js';
import { config } from '../config.js';
import { runCustomHook } from '../integrate/hooks.js';

export function createApiApp(discordClient) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'mdt-discord-bot', discord: Boolean(discordClient) });
  });

  const api = express.Router();
  api.use(apiAuth);

  /** GET /api/citizens/search?q=Marcus&mode=name */
  api.get('/citizens/search', (req, res) => {
    const results = searchCitizens(req.query.q ?? '', req.query.mode ?? 'name');
    res.json({ ok: true, results });
  });

  api.get('/citizens/:id', (req, res) => {
    const citizen = getCitizenById(req.params.id);
    if (!citizen) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json({ ok: true, citizen });
  });

  api.get('/incidents', (_req, res) => res.json({ ok: true, incidents: getIncidents() }));
  api.get('/warrants', (_req, res) => res.json({ ok: true, warrants: getWarrants() }));
  api.get('/bulletins', (_req, res) => res.json({ ok: true, bulletins: getBulletins() }));
  api.get('/units', (_req, res) => res.json({ ok: true, units: getUnits() }));

  /** POST /api/duty — سجل خدمة */
  api.post('/duty', async (req, res) => {
    const { officer, action, department, callsign } = req.body;
    const entry = { officerName: officer?.name ?? 'Unknown', action, department, callsign };
    addDutyLog(entry);
    appendAudit({ action: action === 'on_duty' ? 'DUTY_ON' : 'DUTY_OFF', ...entry });
    await runCustomHook('onDuty', { entry, discordClient });
    res.json({ ok: true, action });
  });

  /** POST /api/export — تصدير إلى Discord */
  api.post('/export', async (req, res) => {
    const { type, data, officer } = req.body;
    const title = type === 'warrants' ? 'تصدير مذكرات التوقيف' : 'تصدير سجل الخدمة';
    const embed = {
      title,
      description: officer ? `طلب من: ${officer.name}` : '',
      color: type === 'warrants' ? 0xff3b5c : 0x22ff88,
      fields: [{ name: 'البيانات', value: '```json\n' + JSON.stringify(data, null, 2).slice(0, 900) + '\n```' }],
      timestamp: new Date().toISOString(),
    };

    let sent = false;
    if (config.discord.exportWebhook) {
      await fetch(config.discord.exportWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
      sent = true;
    } else if (discordClient && config.discord.logChannelId) {
      const ch = await discordClient.channels.fetch(config.discord.logChannelId).catch(() => null);
      if (ch?.isTextBased()) {
        await ch.send({ embeds: [embed] });
        sent = true;
      }
    }

    await runCustomHook('onExport', { type, data, officer, discordClient });
    appendAudit({ action: 'EXPORT', type, officer: officer?.name });
    res.json({ ok: true, sent });
  });

  /** POST /api/fines */
  api.post('/fines', async (req, res) => {
    const { total, charges, officer } = req.body;
    await runCustomHook('onFine', { total, charges, officer, discordClient });
    appendAudit({ action: 'FINE', total, officer: officer?.name });
    res.json({ ok: true });
  });

  /** POST /api/notify — إشعار Discord */
  api.post('/notify', async (req, res) => {
    const { title, message, channelId } = req.body;
    await runCustomHook('onNotify', { title, message, channelId, discordClient });
    res.json({ ok: true });
  });

  /** GET /api/store — للتطوير فقط (أزل في الإنتاج إن لزم) */
  api.get('/sync/full', (_req, res) => {
    res.json({ ok: true, store: getStore() });
  });

  app.use('/api', api);

  // ─── نقطة تمديد لبوتك المخصص ───
  runCustomHook('extendApi', { app, api, apiAuth, discordClient });

  return app;
}
