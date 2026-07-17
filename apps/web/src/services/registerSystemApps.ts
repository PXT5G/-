'use client';

import dynamic from 'next/dynamic';
import { registerApp } from '@/services/appRouter';
import type { AppManifest } from '@/types';

// Manifests are tiny — keep them in the boot bundle for instant metadata
import { gulfStoreManifest } from '@/apps/banana-app/manifest';
import { mapsManifest } from '@/apps/maps/manifest';
import { cameraManifest } from '@/apps/camera/manifest';
import { galleryManifest } from '@/apps/gallery/manifest';
import { filesManifest } from '@/apps/files/manifest';
import { calendarManifest } from '@/apps/calendar/manifest';
import { clockManifest } from '@/apps/clock/manifest';
import { calculatorManifest } from '@/apps/calculator/manifest';
import { notesManifest } from '@/apps/notes/manifest';
import { voiceRecorderManifest } from '@/apps/voice-recorder/manifest';
import { weatherManifest } from '@/apps/weather/manifest';
import { policeManifest } from '@/apps/police/manifest';
import { poetryManifest } from '@/apps/poetry/manifest';
import { browserManifest } from '@/apps/browser/manifest';
import { chatManifest } from '@/apps/chat/manifest';
import { justiceManifest } from '@/apps/justice/manifest';
import { emsManifest } from '@/apps/ems/manifest';
import { businessManifest } from '@/apps/business/manifest';
import { realEstateManifest } from '@/apps/real-estate/manifest';
import { vehiclesManifest } from '@/apps/vehicles/manifest';
import { aviationManifest } from '@/apps/aviation/manifest';
import { marineManifest } from '@/apps/marine/manifest';
import { exchangeManifest } from '@/apps/exchange/manifest';
import { phoneManifest } from '@/apps/phone/manifest';
import { contactsManifest } from '@/apps/contacts/manifest';
import { messagesManifest } from '@/apps/messages/manifest';
import { mailManifest } from '@/apps/mail/manifest';
import { simManifest } from '@/apps/sim/manifest';
import { bankManifest } from '@/apps/bank/manifest';
import { identityManifest } from '@/apps/identity/manifest';
import { assistantManifest } from '@/apps/assistant/manifest';
import { automationManifest } from '@/apps/automation/manifest';
import { shortcutsManifest } from '@/apps/shortcuts/manifest';
import { focusManifest } from '@/apps/focus/manifest';
import { intelligenceManifest } from '@/apps/intelligence/manifest';
import { personalizationManifest } from '@/apps/personalization/manifest';
import { securityManifest } from '@/apps/security/manifest';
import { privacyManifest } from '@/apps/privacy/manifest';
import { cloudManifest } from '@/apps/cloud/manifest';
import { findMyManifest } from '@/apps/find-my/manifest';
import { developerManifest } from '@/apps/developer/manifest';
import { analyticsManifest } from '@/apps/analytics/manifest';
import { diagnosticsManifest } from '@/apps/diagnostics/manifest';
import { enterpriseManifest } from '@/apps/enterprise/manifest';
import { performanceManifest } from '@/apps/performance/manifest';
import { updatesManifest } from '@/apps/updates/manifest';

const settingsManifest: AppManifest = {
  id: 'com.gulfos.settings',
  bundleId: 'com.gulfos.settings',
  name: 'Settings',
  version: '1.0.0',
  description: 'System settings and preferences',
  icon: '⚙️',
  category: 'system',
  permissions: [],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/settings',
};

/**
 * App components are code-split: each app ships as its own chunk that
 * loads on first launch instead of at boot. Behavior is unchanged — the
 * chunk resolves inside the 400ms window-open animation.
 */
type Loader = () => Promise<{ default: React.ComponentType<{ appId?: string; appName?: string }> }>;

const lazy = (load: Loader) => dynamic(load, { ssr: false, loading: () => null });

const APPS: Array<[AppManifest, ReturnType<typeof lazy>]> = [
  [settingsManifest, lazy(() => import('@/components/settings/SettingsApp').then((m) => ({ default: m.SettingsApp })))],
  [gulfStoreManifest, lazy(() => import('@/apps/banana-app').then((m) => ({ default: m.GulfStoreApp })))],
  [mapsManifest, lazy(() => import('@/apps/maps').then((m) => ({ default: m.MapsApp })))],
  [cameraManifest, lazy(() => import('@/apps/camera').then((m) => ({ default: m.CameraApp })))],
  [galleryManifest, lazy(() => import('@/apps/gallery').then((m) => ({ default: m.GalleryApp })))],
  [filesManifest, lazy(() => import('@/apps/files').then((m) => ({ default: m.FilesApp })))],
  [calendarManifest, lazy(() => import('@/apps/calendar').then((m) => ({ default: m.CalendarApp })))],
  [clockManifest, lazy(() => import('@/apps/clock').then((m) => ({ default: m.ClockApp })))],
  [calculatorManifest, lazy(() => import('@/apps/calculator').then((m) => ({ default: m.CalculatorApp })))],
  [notesManifest, lazy(() => import('@/apps/notes').then((m) => ({ default: m.NotesApp })))],
  [voiceRecorderManifest, lazy(() => import('@/apps/voice-recorder').then((m) => ({ default: m.VoiceRecorderApp })))],
  [weatherManifest, lazy(() => import('@/apps/weather').then((m) => ({ default: m.WeatherApp })))],
  [policeManifest, lazy(() => import('@/apps/police').then((m) => ({ default: m.PoliceApp })))],
  [poetryManifest, lazy(() => import('@/apps/poetry').then((m) => ({ default: m.PoetryApp })))],
  [browserManifest, lazy(() => import('@/apps/browser').then((m) => ({ default: m.BrowserApp })))],
  [chatManifest, lazy(() => import('@/apps/chat').then((m) => ({ default: m.ChatApp })))],
  [justiceManifest, lazy(() => import('@/apps/justice').then((m) => ({ default: m.JusticeApp })))],
  [emsManifest, lazy(() => import('@/apps/ems').then((m) => ({ default: m.EmsApp })))],
  [businessManifest, lazy(() => import('@/apps/business').then((m) => ({ default: m.BusinessApp })))],
  [realEstateManifest, lazy(() => import('@/apps/real-estate').then((m) => ({ default: m.RealEstateApp })))],
  [vehiclesManifest, lazy(() => import('@/apps/vehicles').then((m) => ({ default: m.VehiclesApp })))],
  [aviationManifest, lazy(() => import('@/apps/aviation').then((m) => ({ default: m.AviationApp })))],
  [marineManifest, lazy(() => import('@/apps/marine').then((m) => ({ default: m.MarineApp })))],
  [exchangeManifest, lazy(() => import('@/apps/exchange').then((m) => ({ default: m.ExchangeApp })))],
  [phoneManifest, lazy(() => import('@/apps/phone').then((m) => ({ default: m.PhoneApp })))],
  [contactsManifest, lazy(() => import('@/apps/contacts').then((m) => ({ default: m.ContactsApp })))],
  [messagesManifest, lazy(() => import('@/apps/messages').then((m) => ({ default: m.MessagesApp })))],
  [mailManifest, lazy(() => import('@/apps/mail').then((m) => ({ default: m.MailApp })))],
  [simManifest, lazy(() => import('@/apps/sim').then((m) => ({ default: m.SimApp })))],
  [bankManifest, lazy(() => import('@/apps/bank').then((m) => ({ default: m.BankApp })))],
  [identityManifest, lazy(() => import('@/apps/identity').then((m) => ({ default: m.IdentityApp })))],
  [assistantManifest, lazy(() => import('@/apps/assistant').then((m) => ({ default: m.AssistantApp })))],
  [automationManifest, lazy(() => import('@/apps/automation').then((m) => ({ default: m.AutomationApp })))],
  [shortcutsManifest, lazy(() => import('@/apps/shortcuts').then((m) => ({ default: m.ShortcutsApp })))],
  [focusManifest, lazy(() => import('@/apps/focus').then((m) => ({ default: m.FocusApp })))],
  [intelligenceManifest, lazy(() => import('@/apps/intelligence').then((m) => ({ default: m.IntelligenceHubApp })))],
  [personalizationManifest, lazy(() => import('@/apps/personalization').then((m) => ({ default: m.PersonalizationApp })))],
  [securityManifest, lazy(() => import('@/apps/security').then((m) => ({ default: m.SecurityApp })))],
  [privacyManifest, lazy(() => import('@/apps/privacy').then((m) => ({ default: m.PrivacyApp })))],
  [cloudManifest, lazy(() => import('@/apps/cloud').then((m) => ({ default: m.CloudApp })))],
  [findMyManifest, lazy(() => import('@/apps/find-my').then((m) => ({ default: m.FindMyApp })))],
  [developerManifest, lazy(() => import('@/apps/developer').then((m) => ({ default: m.DeveloperApp })))],
  [analyticsManifest, lazy(() => import('@/apps/analytics').then((m) => ({ default: m.AnalyticsApp })))],
  [diagnosticsManifest, lazy(() => import('@/apps/diagnostics').then((m) => ({ default: m.DiagnosticsApp })))],
  [enterpriseManifest, lazy(() => import('@/apps/enterprise').then((m) => ({ default: m.EnterpriseApp })))],
  [performanceManifest, lazy(() => import('@/apps/performance').then((m) => ({ default: m.PerformanceApp })))],
  [updatesManifest, lazy(() => import('@/apps/updates').then((m) => ({ default: m.UpdatesApp })))],
];

for (const [manifest, component] of APPS) {
  registerApp(manifest, component);
}

/**
 * Warm the chunks for dock apps + Settings during idle time after boot,
 * so the first launch is as instant as it was before code-splitting.
 */
const PREFETCH = [
  () => import('@/components/settings/SettingsApp'),
  () => import('@/apps/banana-app'),
  () => import('@/apps/phone'),
  () => import('@/apps/chat'),
];

if (typeof window !== 'undefined') {
  const warm = () => PREFETCH.forEach((load) => { void load().catch(() => {}); });
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 2500 });
  } else {
    setTimeout(warm, 2500);
  }
}
