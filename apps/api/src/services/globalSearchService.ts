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
import { FileNode } from '../database/models/FileNode';
import { GalleryItem } from '../database/models/GalleryItem';
import { BrowserHistoryEntry } from '../database/models/BrowserHistoryEntry';
import { BrowserDownload } from '../database/models/BrowserDownload';
import { ChatProfile } from '../database/models/ChatProfile';

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

async function searchFiles(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const files = await FileNode.find({
    userId: new Types.ObjectId(userId),
    type: 'file',
    deletedAt: null,
    name: regex,
  })
    .limit(15)
    .lean();

  return files.map((f) => ({
    id: f._id.toString(),
    category: 'files' as const,
    title: f.name,
    subtitle: f.mimeType,
    route: 'com.gulfos.files',
  }));
}

async function searchPhotos(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const items = await GalleryItem.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    trashed: false,
    name: regex,
  })
    .limit(15)
    .lean();

  return items.map((i) => ({
    id: i.itemId,
    category: 'photos' as const,
    title: i.name,
    subtitle: i.type,
    route: 'com.gulfos.gallery',
  }));
}

async function searchBrowserHistory(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const entries = await BrowserHistoryEntry.find({
    userId: new Types.ObjectId(userId),
    $or: [{ title: regex }, { url: regex }],
  })
    .limit(15)
    .lean();

  return entries.map((e) => ({
    id: e.historyId,
    category: 'browser_history' as const,
    title: e.title ?? e.url,
    subtitle: e.url,
    route: 'com.gulfos.browser',
  }));
}

async function searchDownloads(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const downloads = await BrowserDownload.find({
    userId: new Types.ObjectId(userId),
    $or: [{ filename: regex }, { url: regex }],
  })
    .limit(15)
    .lean();

  return downloads.map((d) => ({
    id: d.downloadId,
    category: 'downloads' as const,
    title: d.filename,
    subtitle: d.status,
    route: 'com.gulfos.browser',
  }));
}

async function searchContacts(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { Contact } = await import('../database/models/Contact');
  const contacts = await Contact.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ displayName: regex }, { firstName: regex }, { lastName: regex }, { company: regex }],
  })
    .limit(15)
    .lean();

  return contacts.map((c) => ({
    id: c.contactId,
    category: 'contacts' as const,
    title: c.displayName,
    subtitle: c.phones?.[0]?.number ?? c.category,
    route: 'com.gulfos.contacts',
  }));
}

async function searchCalls(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { PhoneCall } = await import('../database/models/PhoneCall');
  const calls = await PhoneCall.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ contactName: regex }, { toNumber: regex }, { fromNumber: regex }],
  })
    .limit(15)
    .lean();

  return calls.map((c) => ({
    id: c.callId,
    category: 'calls' as const,
    title: c.contactName ?? c.toNumber ?? c.fromNumber,
    subtitle: `${c.direction} · ${c.status}`,
    route: 'com.gulfos.phone',
  }));
}

async function searchBankAccounts(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { BankAccount } = await import('../database/models/BankAccount');
  const accounts = await BankAccount.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ name: regex }, { accountNumber: regex }, { iban: regex }],
  }).limit(10).lean();
  return accounts.map((a) => ({
    id: a.accountId,
    category: 'bank_accounts' as const,
    title: a.name,
    subtitle: `${a.accountType} · ${a.availableBalance.toLocaleString()} ${a.currency}`,
    route: 'com.gulfos.bank',
  }));
}

async function searchIdentity(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { CitizenIdentity } = await import('../database/models/CitizenIdentity');
  const { IdentityDocument } = await import('../database/models/IdentityDocument');
  const [identities, documents] = await Promise.all([
    CitizenIdentity.find({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
      $or: [{ fullName: regex }, { nationalId: regex }],
    }).limit(5).lean(),
    IdentityDocument.find({
      userId: new Types.ObjectId(userId),
      deletedAt: null,
      $or: [{ title: regex }, { documentNumber: regex }],
    }).limit(10).lean(),
  ]);
  const identityResults = identities.map((i) => ({
    id: i.identityId,
    category: 'identity' as const,
    title: i.fullName,
    subtitle: `National ID: ${i.nationalId}`,
    route: 'com.gulfos.identity',
  }));
  const docResults = documents.map((d) => ({
    id: d.documentId,
    category: 'identity' as const,
    title: d.title,
    subtitle: d.documentType,
    route: 'com.gulfos.identity',
  }));
  return [...identityResults, ...docResults];
}

async function searchMail(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { MailMessage } = await import('../database/models/MailMessage');
  const messages = await MailMessage.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ subject: regex }, { bodyText: regex }, { from: regex }],
  }).limit(15).lean();
  return messages.map((m) => ({
    id: m.messageId,
    category: 'mail' as const,
    title: m.subject,
    subtitle: m.from,
    route: 'com.gulfos.mail',
  }));
}

async function searchAssistant(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { AssistantConversation } = await import('../database/models/AssistantConversation');
  const conversations = await AssistantConversation.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ title: regex }, { summary: regex }],
  }).limit(15).lean();
  return conversations.map((c) => ({
    id: c.conversationId,
    category: 'assistant' as const,
    title: c.title,
    subtitle: c.summary ?? `${c.messageCount} messages`,
    route: 'com.gulfos.assistant',
  }));
}

async function searchShortcuts(userId: string, regex: RegExp): Promise<SearchResult[]> {
  const { Shortcut } = await import('../database/models/Shortcut');
  const shortcuts = await Shortcut.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    $or: [{ name: regex }, { description: regex }],
  }).limit(15).lean();
  return shortcuts.map((s) => ({
    id: s.shortcutId,
    category: 'shortcuts' as const,
    title: s.name,
    subtitle: s.description ?? `${s.runCount} runs`,
    route: 'com.gulfos.shortcuts',
  }));
}

const CATEGORY_SEARCHERS: Record<
  SearchCategory,
  (userId: string, regex: RegExp) => Promise<SearchResult[]>
> = {
  apps: searchApps,
  contacts: searchContacts,
  files: searchFiles,
  photos: searchPhotos,
  messages: searchMessages,
  settings: searchSettings,
  businesses: searchBusinesses,
  properties: async (_u, r) => searchProperties(r),
  vehicles: async (_u, r) => searchVehicles(r),
  aircraft: async (_u, r) => searchAircraft(r),
  marine: async (_u, r) => searchMarine(r),
  stocks: async (_u, r) => searchStocks(r),
  bank_accounts: searchBankAccounts,
  identity: searchIdentity,
  notes: searchNotes,
  calendar: searchCalendar,
  weather: async () => [],
  police: async (_u, r) => searchPolice(r),
  justice: async (_u, r) => searchJustice(r),
  ems: async (_u, r) => searchEms(r),
  browser_history: searchBrowserHistory,
  downloads: searchDownloads,
  calls: searchCalls,
  mail: searchMail,
  assistant: searchAssistant,
  shortcuts: searchShortcuts,
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
