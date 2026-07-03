import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const SEED_PATH = path.join(DATA_DIR, 'seed.json');
const AUDIT_PATH = path.join(DATA_DIR, 'audit.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn('[store] read error', file, e.message);
  }
  return fallback;
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/** مصدر البيانات الوحيد — MDT Web و FiveM يقرآن عبر API فقط */
export function getStore() {
  let store = readJson(STORE_PATH, null);
  if (!store) {
    store = readJson(SEED_PATH, { citizens: [], incidents: [], warrants: [], bulletins: [], units: [], dutyLogs: [] });
    writeJson(STORE_PATH, store);
  }
  return store;
}

export function saveStore(store) {
  writeJson(STORE_PATH, store);
}

export function appendAudit(entry) {
  const logs = readJson(AUDIT_PATH, []);
  logs.unshift({ ...entry, id: `a-${Date.now()}`, timestamp: new Date().toISOString() });
  writeJson(AUDIT_PATH, logs.slice(0, 500));
}

export function searchCitizens(query, mode = 'name') {
  const q = String(query).trim().toLowerCase();
  if (!q) return [];
  const { citizens } = getStore();
  return citizens.filter((d) => {
    switch (mode) {
      case 'id':
        return d.nationalId?.toLowerCase().includes(q);
      case 'phone':
        return d.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, ''));
      case 'plate':
        return d.vehicles?.some((v) => v.plate?.toLowerCase().includes(q));
      default:
        return (
          d.firstName?.toLowerCase().includes(q) ||
          d.lastName?.toLowerCase().includes(q) ||
          d.fullName?.toLowerCase().includes(q)
        );
    }
  });
}

export function getCitizenById(id) {
  return getStore().citizens.find((c) => c.id === id);
}

export function getIncidents() {
  return getStore().incidents ?? [];
}

export function getWarrants() {
  return getStore().warrants ?? [];
}

export function getBulletins() {
  return getStore().bulletins ?? [];
}

export function getUnits() {
  return getStore().units ?? [];
}

export function addDutyLog(entry) {
  const store = getStore();
  store.dutyLogs = store.dutyLogs ?? [];
  store.dutyLogs.unshift({ ...entry, id: `duty-${Date.now()}`, timestamp: new Date().toISOString() });
  saveStore(store);
}
