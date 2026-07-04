import { Types } from 'mongoose';
import type { SearchCategory } from '../constants/phoneOs';
import { InstalledPackage } from '../database/models/InstalledPackage';
import { Message } from '../database/models/Message';
import { Note } from '../database/models/Note';
import { CalendarEvent } from '../database/models/CalendarEvent';
import { Company } from '../database/models/Company';
import { Property } from '../database/models/Property';
import { Vehicle } from '../database/models/Vehicle';
import { Aircraft } from '../database/models/Aircraft';
import { Vessel } from '../database/models/Vessel';
import { Stock } from '../database/models/Stock';
import { ListedCompany } from '../database/models/ListedCompany';
import { PoliceCase } from '../database/models/PoliceCase';
import { JusticeCase } from '../database/models/JusticeCase';
import { EmsDispatch } from '../database/models/EmsDispatch';
import { UserSettings } from '../database/models/UserSettings';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  icon?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}

function escapeRegex(q: string): string {
  return q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function searchApps(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const packages = await InstalledPackage.find({
    userId: new Types.ObjectId(userId),
    $or: [{ bundleId: regex }, { developer: regex }, { packageId: regex }],
  })
    .limit(20)
    .lean();

  return packages.map((p) => ({
    id: p.bundleId,
    category: 'apps' as const,
    title: p.bundleId,
    subtitle: p.developer,
    route: p.bundleId,
  }));
}

async function searchMessages(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const messages = await Message.find({
    senderId: new Types.ObjectId(userId),
    deletedAt: null,
    body: regex,
  })
    .limit(15)
    .lean();

  return messages.map((m) => ({
    id: m.messageId,
    category: 'messages' as const,
    title: m.body?.slice(0, 80) ?? 'Message',
    subtitle: m.conversationId,
  }));
}

async function searchNotes(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const notes = await Note.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ title: regex }, { content: regex }],
  })
    .limit(15)
    .lean();

  return notes.map((n) => ({
    id: n._id.toString(),
    category: 'notes' as const,
    title: n.title ?? 'Note',
    subtitle: (n.content as string)?.slice(0, 60),
  }));
}

async function searchCalendar(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const events = await CalendarEvent.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ title: regex }, { location: regex }],
  })
    .limit(15)
    .lean();

  return events.map((e) => ({
    id: e._id.toString(),
    category: 'calendar' as const,
    title: e.title,
    subtitle: e.location,
  }));
}

async function searchBusinesses(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const companies = await Company.find({
    deletedAt: null,
    $or: [{ name: regex }, { companyId: regex }, { category: regex }, { tradeName: regex }],
  })
    .limit(15)
    .lean();

  return companies.map((c) => ({
    id: c.companyId,
    category: 'businesses' as const,
    title: c.name,
    subtitle: c.category,
    route: 'com.gulfos.business',
  }));
}

async function searchProperties(regex: RegExp): Promise<SearchResult[]> {
  const properties = await Property.find({
    deletedAt: null,
    $or: [{ title: regex }, { propertyId: regex }, { 'location.city': regex }],
  })
    .limit(15)
    .lean();

  return properties.map((p) => ({
    id: p.propertyId,
    category: 'properties' as const,
    title: p.title,
    subtitle: p.location?.city,
    route: 'com.gulfos.realestate',
  }));
}

async function searchVehicles(regex: RegExp): Promise<SearchResult[]> {
  const vehicles = await Vehicle.find({
    deletedAt: null,
    $or: [{ brand: regex }, { vehicleModel: regex }, { vehicleId: regex }, { vin: regex }],
  })
    .limit(15)
    .lean();

  return vehicles.map((v) => ({
    id: v.vehicleId,
    category: 'vehicles' as const,
    title: `${v.year} ${v.brand} ${v.vehicleModel}`,
    subtitle: v.vehicleId,
    route: 'com.gulfos.auto',
  }));
}

async function searchAircraft(regex: RegExp): Promise<SearchResult[]> {
  const aircraft = await Aircraft.find({
    deletedAt: null,
    $or: [{ manufacturer: regex }, { model: regex }, { aircraftId: regex }, { registrationNumber: regex }],
  })
    .limit(15)
    .lean();

  return aircraft.map((a) => ({
    id: a.aircraftId,
    category: 'aircraft' as const,
    title: `${a.manufacturer} ${a.model}`,
    subtitle: a.registrationNumber,
    route: 'com.gulfos.aviation',
  }));
}

async function searchMarine(regex: RegExp): Promise<SearchResult[]> {
  const vessels = await Vessel.find({
    deletedAt: null,
    $or: [{ vesselId: regex }, { manufacturer: regex }, { vesselModel: regex }, { registrationNumber: regex }],
  })
    .limit(15)
    .lean();

  return vessels.map((v) => ({
    id: v.vesselId,
    category: 'marine' as const,
    title: `${v.manufacturer} ${v.vesselModel}`,
    subtitle: v.vesselId,
    route: 'com.gulfos.marine',
  }));
}

async function searchStocks(regex: RegExp): Promise<SearchResult[]> {
  const [stocks, companies] = await Promise.all([
    Stock.find({ deletedAt: null, $or: [{ ticker: regex }, { name: regex }] }).limit(10).lean(),
    ListedCompany.find({ deletedAt: null, $or: [{ ticker: regex }, { name: regex }] }).limit(10).lean(),
  ]);

  const stockResults = stocks.map((s) => ({
    id: s.ticker,
    category: 'stocks' as const,
    title: s.name ?? s.ticker,
    subtitle: s.ticker,
    route: 'com.gulfos.exchange',
  }));

  const companyResults = companies.map((c) => ({
    id: c.ticker,
    category: 'stocks' as const,
    title: c.name,
    subtitle: c.ticker,
    route: 'com.gulfos.exchange',
  }));

  const seen = new Set<string>();
  return [...stockResults, ...companyResults].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

async function searchPolice(regex: RegExp): Promise<SearchResult[]> {
  const cases = await PoliceCase.find({
    deletedAt: null,
    $or: [{ caseId: regex }, { title: regex }, { description: regex }],
  })
    .limit(10)
    .lean();

  return cases.map((c) => ({
    id: c.caseId,
    category: 'police' as const,
    title: c.title ?? c.caseId,
    subtitle: c.status,
    route: 'com.gulfos.police',
  }));
}

async function searchJustice(regex: RegExp): Promise<SearchResult[]> {
  const cases = await JusticeCase.find({
    deletedAt: null,
    $or: [{ caseNumber: regex }, { title: regex }],
  })
    .limit(10)
    .lean();

  return cases.map((c) => ({
    id: c.caseNumber,
    category: 'justice' as const,
    title: c.title ?? c.caseNumber,
    subtitle: c.status,
    route: 'com.gulfos.justice',
  }));
}

async function searchEms(regex: RegExp): Promise<SearchResult[]> {
  const dispatches = await EmsDispatch.find({
    deletedAt: null,
    $or: [{ dispatchId: regex }, { callType: regex }, { title: regex }, { address: regex }],
  })
    .limit(10)
    .lean();

  return dispatches.map((d) => ({
    id: d.dispatchId,
    category: 'ems' as const,
    title: d.title ?? d.callType,
    subtitle: d.address,
    route: 'com.gulfos.ems',
  }));
}

async function searchSettings(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const settings = await UserSettings.findOne({ userId: new Types.ObjectId(userId) });
  if (!settings) return [];

  const entries: SearchResult[] = [];
  const checks: [string, string][] = [
    ['Theme', settings.theme],
    ['Language', settings.language],
    ['Region', settings.region],
    ['WiFi', settings.wifiEnabled ? 'enabled' : 'disabled'],
    ['Bluetooth', settings.bluetoothEnabled ? 'enabled' : 'disabled'],
    ['Silent Mode', settings.silentMode ? 'on' : 'off'],
    ['Low Power Mode', settings.lowPowerMode ? 'on' : 'off'],
    ['VoiceOver', settings.voiceOverEnabled ? 'on' : 'off'],
    ['Developer Mode', settings.developerModeEnabled ? 'on' : 'off'],
  ];

  for (const [label, value] of checks) {
    if (regex.test(label) || regex.test(String(value))) {
      entries.push({
        id: `settings-${label.toLowerCase().replace(/\s/g, '-')}`,
        category: 'settings',
        title: label,
        subtitle: String(value),
        route: 'com.gulfos.settings',
      });
    }
  }

  return entries;
}

const CATEGORY_SEARCHERS: Record<
  SearchCategory,
  (userId: string, regex: RegExp) => Promise<SearchResult[]>
> = {
  apps: searchApps,
  contacts: async () => [],
  files: async () => [],
  photos: async () => [],
  messages: searchMessages,
  settings: searchSettings,
  businesses: searchBusinesses,
  properties: async (_u, r) => searchProperties(r),
  vehicles: async (_u, r) => searchVehicles(r),
  aircraft: async (_u, r) => searchAircraft(r),
  marine: async (_u, r) => searchMarine(r),
  stocks: async (_u, r) => searchStocks(r),
  bank_accounts: async () => [],
  notes: searchNotes,
  calendar: searchCalendar,
  weather: async () => [],
  police: async (_u, r) => searchPolice(r),
  justice: async (_u, r) => searchJustice(r),
  ems: async (_u, r) => searchEms(r),
};

export async function globalSearch(
  userId: string,
  query: string,
  categories?: SearchCategory[]
) {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: '', results: [], total: 0, categories: {} as Record<string, number> };
  }

  const regex = new RegExp(escapeRegex(trimmed), 'i');
  const cats = categories?.length ? categories : (Object.keys(CATEGORY_SEARCHERS) as SearchCategory[]);

  const results: SearchResult[] = [];
  const categoryCounts: Record<string, number> = {};

  await Promise.all(
    cats.map(async (cat) => {
      try {
        const items = await CATEGORY_SEARCHERS[cat](userId, regex);
        categoryCounts[cat] = items.length;
        results.push(...items);
      } catch {
        categoryCounts[cat] = 0;
      }
    })
  );

  results.sort((a, b) => a.title.localeCompare(b.title));

  return {
    query: trimmed,
    results: results.slice(0, 100),
    total: results.length,
    categories: categoryCounts,
  };
}
