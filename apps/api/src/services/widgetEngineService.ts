import { Types } from 'mongoose';
import { WidgetRegistryEntry } from '../database/models/WidgetRegistryEntry';

const WIDGET_SEED: Array<{
  widgetId: string;
  type: string;
  appId: string;
  name: string;
  description: string;
  sizes: ('small' | 'medium' | 'large')[];
  defaultSize: 'small' | 'medium' | 'large';
  interactive: boolean;
  icon: string;
}> = [
  { widgetId: 'widget.weather', type: 'weather', appId: 'com.gulfos.weather', name: 'Weather', description: 'Current weather and forecast', sizes: ['small', 'medium', 'large'], defaultSize: 'medium', interactive: true, icon: '🌤️' },
  { widgetId: 'widget.calendar', type: 'calendar', appId: 'com.gulfos.calendar', name: 'Calendar', description: 'Upcoming events', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '📅' },
  { widgetId: 'widget.battery', type: 'battery', appId: 'com.gulfos.system', name: 'Battery', description: 'Battery level and health', sizes: ['small', 'medium'], defaultSize: 'small', interactive: false, icon: '🔋' },
  { widgetId: 'widget.stocks', type: 'stocks', appId: 'com.gulfos.exchange', name: 'Stocks', description: 'Market watchlist', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '📈' },
  { widgetId: 'widget.clock', type: 'clock', appId: 'com.gulfos.clock', name: 'Clock', description: 'World clock and alarms', sizes: ['small', 'medium'], defaultSize: 'small', interactive: false, icon: '🕐' },
  { widgetId: 'widget.music', type: 'music', appId: 'com.gulfos.music', name: 'Music', description: 'Now playing', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '🎵' },
  { widgetId: 'widget.maps', type: 'maps', appId: 'com.gulfos.maps', name: 'Maps', description: 'Location and navigation', sizes: ['medium', 'large'], defaultSize: 'large', interactive: true, icon: '🗺️' },
  { widgetId: 'widget.bank', type: 'bank', appId: 'com.gulfos.bank', name: 'Bank', description: 'Account balance', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '🏦' },
  { widgetId: 'widget.business', type: 'business', appId: 'com.gulfos.business', name: 'Business', description: 'Revenue dashboard', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '💼' },
  { widgetId: 'widget.ems', type: 'ems', appId: 'com.gulfos.ems', name: 'EMS', description: 'Active dispatches', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '🚑' },
  { widgetId: 'widget.police', type: 'police', appId: 'com.gulfos.police', name: 'Police', description: 'Active cases', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '🚔' },
  { widgetId: 'widget.justice', type: 'justice', appId: 'com.gulfos.justice', name: 'Justice', description: 'Court schedule', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '⚖️' },
  { widgetId: 'widget.exchange', type: 'exchange', appId: 'com.gulfos.exchange', name: 'Exchange', description: 'Portfolio value', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '📊' },
  { widgetId: 'widget.realestate', type: 'realestate', appId: 'com.gulfos.realestate', name: 'Real Estate', description: 'Property listings', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '🏠' },
  { widgetId: 'widget.vehicles', type: 'vehicles', appId: 'com.gulfos.auto', name: 'Vehicles', description: 'Vehicle inventory', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '🚗' },
  { widgetId: 'widget.marine', type: 'marine', appId: 'com.gulfos.marine', name: 'Marine', description: 'Vessel listings', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '⛵' },
  { widgetId: 'widget.aviation', type: 'aviation', appId: 'com.gulfos.aviation', name: 'Aviation', description: 'Aircraft listings', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '✈️' },
  { widgetId: 'widget.chat', type: 'chat', appId: 'com.gulfos.chat', name: 'Chat', description: 'Recent conversations', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '💬' },
  { widgetId: 'widget.notes', type: 'notes', appId: 'com.gulfos.notes', name: 'Notes', description: 'Pinned notes', sizes: ['small', 'medium'], defaultSize: 'small', interactive: true, icon: '📝' },
  { widgetId: 'widget.poetry', type: 'poetry', appId: 'com.gulfos.poetry', name: 'Poetry', description: 'Trending poems', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '📜' },
  { widgetId: 'widget.files', type: 'files', appId: 'com.gulfos.files', name: 'Files', description: 'Recent files', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '📁' },
  { widgetId: 'widget.photos', type: 'photos', appId: 'com.gulfos.gallery', name: 'Photos', description: 'Recent photos', sizes: ['medium', 'large'], defaultSize: 'medium', interactive: true, icon: '🖼️' },
  { widgetId: 'widget.camera', type: 'camera', appId: 'com.gulfos.camera', name: 'Camera', description: 'Quick capture', sizes: ['small'], defaultSize: 'small', interactive: true, icon: '📷' },
  { widgetId: 'widget.browser', type: 'browser', appId: 'com.gulfos.browser', name: 'Browser', description: 'Bookmarks and tabs', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '🌐' },
  { widgetId: 'widget.phone', type: 'phone', appId: 'com.gulfos.phone', name: 'Phone', description: 'Recent calls', sizes: ['small', 'medium'], defaultSize: 'small', interactive: true, icon: '📞' },
  { widgetId: 'widget.contacts', type: 'contacts', appId: 'com.gulfos.contacts', name: 'Contacts', description: 'Favorite contacts', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '👤' },
  { widgetId: 'widget.messages', type: 'messages', appId: 'com.gulfos.messages', name: 'Messages', description: 'Recent SMS', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '💬' },
  { widgetId: 'widget.mail', type: 'mail', appId: 'com.gulfos.mail', name: 'Mail', description: 'Unread mail', sizes: ['medium'], defaultSize: 'medium', interactive: true, icon: '📧' },
];

export async function seedWidgetRegistry() {
  for (const entry of WIDGET_SEED) {
    await WidgetRegistryEntry.findOneAndUpdate(
      { widgetId: entry.widgetId },
      { ...entry, live: true, animated: true, refreshIntervalSec: 60, enabled: true },
      { upsert: true }
    );
  }
  return WIDGET_SEED.length;
}

export async function getWidgetRegistry() {
  await seedWidgetRegistry();
  const entries = await WidgetRegistryEntry.find({ enabled: true }).sort({ name: 1 });
  return entries.map((e) => ({
    widgetId: e.widgetId,
    type: e.type,
    appId: e.appId,
    name: e.name,
    description: e.description,
    sizes: e.sizes,
    defaultSize: e.defaultSize,
    interactive: e.interactive,
    live: e.live,
    animated: e.animated,
    refreshIntervalSec: e.refreshIntervalSec,
    icon: e.icon,
  }));
}

export async function getWidgetData(userId: string, type: string, config?: Record<string, unknown>) {
  switch (type) {
    case 'weather':
      return getWeatherWidgetData(userId);
    case 'calendar':
      return getCalendarWidgetData(userId);
    case 'battery':
      return getBatteryWidgetData(userId);
    case 'stocks':
    case 'exchange':
      return getStocksWidgetData(userId);
    case 'clock':
      return getClockWidgetData();
    case 'business':
      return getBusinessWidgetData(userId);
    case 'ems':
      return getEmsWidgetData();
    case 'police':
      return getPoliceWidgetData();
    case 'justice':
      return getJusticeWidgetData();
    case 'notes':
      return getNotesWidgetData(userId);
    case 'photos':
      return getPhotosWidgetData(userId);
    case 'files':
      return getFilesWidgetData(userId);
    case 'browser':
      return getBrowserWidgetData(userId);
    case 'phone':
      return getPhoneWidgetData(userId);
    case 'contacts':
      return getContactsWidgetData(userId);
    case 'messages':
      return getMessagesWidgetData(userId);
    case 'mail':
      return getMailWidgetData(userId);
    default:
      return { type, title: type, subtitle: 'Widget data', updatedAt: new Date().toISOString(), config };
  }
}

async function getWeatherWidgetData(userId: string) {
  const { getWeather } = await import('./weatherService');
  const weather = await getWeather(userId);
  const current = weather?.current as Record<string, unknown> | undefined;
  return {
    type: 'weather',
    temperature: current?.tempC ?? 24,
    label: current?.label ?? 'Clear',
    humidity: current?.humidity ?? 45,
    windKph: current?.windKph ?? 12,
    updatedAt: new Date().toISOString(),
  };
}

async function getCalendarWidgetData(userId: string) {
  const { CalendarEvent } = await import('../database/models/CalendarEvent');
  const events = await CalendarEvent.find({
    userId: new Types.ObjectId(userId),
    deletedAt: null,
    startAt: { $gte: new Date() },
  })
    .sort({ startAt: 1 })
    .limit(5)
    .lean();
  return {
    type: 'calendar',
    events: events.map((e) => ({
      id: e._id.toString(),
      title: e.title,
      startAt: e.startAt?.toISOString(),
      location: e.location,
    })),
    updatedAt: new Date().toISOString(),
  };
}

async function getBatteryWidgetData(userId: string) {
  const { syncBatteryState } = await import('./phoneOsService');
  const battery = await syncBatteryState(userId);
  return { type: 'battery', ...battery, updatedAt: new Date().toISOString() };
}

async function getStocksWidgetData(userId: string) {
  const { Stock } = await import('../database/models/Stock');
  const { Portfolio } = await import('../database/models/Portfolio');
  const [stocks, portfolio] = await Promise.all([
    Stock.find({ deletedAt: null, tradingStatus: 'active' }).sort({ volume24h: -1 }).limit(5).lean(),
    Portfolio.findOne({ userId: new Types.ObjectId(userId), deletedAt: null }).lean(),
  ]);
  return {
    type: 'stocks',
    watchlist: stocks.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.currentPrice,
      change: ((s.currentPrice - s.openingPrice) / Math.max(s.openingPrice, 0.01)) * 100,
    })),
    portfolioValue: portfolio?.portfolioValue ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

function getClockWidgetData() {
  const now = new Date();
  return {
    type: 'clock',
    time: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    updatedAt: now.toISOString(),
  };
}

async function getBusinessWidgetData(userId: string) {
  const { Company } = await import('../database/models/Company');
  const companies = await Company.find({ ownerUserId: new Types.ObjectId(userId), deletedAt: null })
    .limit(3)
    .lean();
  return {
    type: 'business',
    companies: companies.map((c) => ({
      id: c.companyId,
      name: c.name,
      revenue: c.totalRevenue,
      profit: c.netProfit,
    })),
    updatedAt: new Date().toISOString(),
  };
}

async function getEmsWidgetData() {
  const { EmsDispatch } = await import('../database/models/EmsDispatch');
  const dispatches = await EmsDispatch.find({ deletedAt: null, status: { $nin: ['resolved', 'cancelled'] } })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  return {
    type: 'ems',
    dispatches: dispatches.map((d) => ({ id: d.dispatchId, title: d.title, status: d.status })),
    updatedAt: new Date().toISOString(),
  };
}

async function getPoliceWidgetData() {
  const { PoliceCase } = await import('../database/models/PoliceCase');
  const cases = await PoliceCase.find({ deletedAt: null, status: { $ne: 'closed' } })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  return {
    type: 'police',
    cases: cases.map((c) => ({ id: c.caseId, title: c.title, status: c.status })),
    updatedAt: new Date().toISOString(),
  };
}

async function getJusticeWidgetData() {
  const { JusticeCase } = await import('../database/models/JusticeCase');
  const cases = await JusticeCase.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  return {
    type: 'justice',
    cases: cases.map((c) => ({ id: c.caseNumber, title: c.title, status: c.status })),
    updatedAt: new Date().toISOString(),
  };
}

async function getNotesWidgetData(userId: string) {
  const { Note } = await import('../database/models/Note');
  const notes = await Note.find({ userId: new Types.ObjectId(userId), deletedAt: null, pinned: true })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
  return {
    type: 'notes',
    notes: notes.map((n) => ({ id: n._id.toString(), title: n.title, preview: (n.content as string)?.slice(0, 80) })),
    updatedAt: new Date().toISOString(),
  };
}

async function getPhotosWidgetData(userId: string) {
  const { GalleryItem } = await import('../database/models/GalleryItem');
  const items = await GalleryItem.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  return {
    type: 'photos',
    count: items.length,
    recent: items.map((i) => ({ id: i.itemId, title: i.name })),
    updatedAt: new Date().toISOString(),
  };
}

async function getFilesWidgetData(userId: string) {
  const { FileNode } = await import('../database/models/FileNode');
  const files = await FileNode.find({ userId: new Types.ObjectId(userId), type: 'file', deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
  return {
    type: 'files',
    files: files.map((f) => ({ id: f._id.toString(), name: f.name, size: f.size })),
    updatedAt: new Date().toISOString(),
  };
}

async function getBrowserWidgetData(userId: string) {
  const { BrowserTab } = await import('../database/models/BrowserTab');
  const tabs = await BrowserTab.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();
  return {
    type: 'browser',
    tabs: tabs.map((t) => ({ id: t.tabId, title: t.title, url: t.url })),
    updatedAt: new Date().toISOString(),
  };
}

async function getPhoneWidgetData(userId: string) {
  const { PhoneCall } = await import('../database/models/PhoneCall');
  const calls = await PhoneCall.find({ userId: new Types.ObjectId(userId), deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
  const stats = await import('./callEngineService').then((m) => m.getCallStatistics(userId));
  return {
    type: 'phone',
    recent: calls.map((c) => ({ callId: c.callId, name: c.contactName ?? c.toNumber, status: c.status, direction: c.direction })),
    missed: stats.missed,
    updatedAt: new Date().toISOString(),
  };
}

async function getContactsWidgetData(userId: string) {
  const { Contact } = await import('../database/models/Contact');
  const favorites = await Contact.find({ userId: new Types.ObjectId(userId), favorite: true, deletedAt: null })
    .limit(5)
    .lean();
  return {
    type: 'contacts',
    favorites: favorites.map((c) => ({ contactId: c.contactId, name: c.displayName, phone: c.phones?.[0]?.number })),
    updatedAt: new Date().toISOString(),
  };
}

async function getMessagesWidgetData(userId: string) {
  const { getUserConversations } = await import('./conversationService');
  const conversations = await getUserConversations(userId, 5);
  return {
    type: 'messages',
    conversations: conversations.slice(0, 3).map((c) => ({ id: c.conversationId, title: c.title, preview: c.lastMessagePreview })),
    updatedAt: new Date().toISOString(),
  };
}

async function getMailWidgetData(userId: string) {
  const { MailAccount } = await import('../database/models/MailAccount');
  const { MailMessage } = await import('../database/models/MailMessage');
  const account = await MailAccount.findOne({ userId: new Types.ObjectId(userId), isDefault: true, deletedAt: null });
  const unread = account
    ? await MailMessage.countDocuments({ userId: new Types.ObjectId(userId), folder: 'inbox', isRead: false, deletedAt: null })
    : 0;
  return {
    type: 'mail',
    unread,
    account: account?.email,
    updatedAt: new Date().toISOString(),
  };
}

export async function getBatchWidgetData(
  userId: string,
  widgets: { type: string; config?: Record<string, unknown> }[]
) {
  return Promise.all(widgets.map((w) => getWidgetData(userId, w.type, w.config)));
}
