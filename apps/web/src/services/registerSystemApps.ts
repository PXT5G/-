'use client';

import { registerApp } from '@/services/appRouter';
import { SettingsApp } from '@/components/settings/SettingsApp';
import { GulfStoreApp } from '@/apps/banana-app';
import { gulfStoreManifest } from '@/apps/banana-app/manifest';
import { MapsApp } from '@/apps/maps';
import { mapsManifest } from '@/apps/maps/manifest';
import { CameraApp } from '@/apps/camera';
import { cameraManifest } from '@/apps/camera/manifest';
import { GalleryApp } from '@/apps/gallery';
import { galleryManifest } from '@/apps/gallery/manifest';
import { FilesApp } from '@/apps/files';
import { filesManifest } from '@/apps/files/manifest';
import { CalendarApp } from '@/apps/calendar';
import { calendarManifest } from '@/apps/calendar/manifest';
import { ClockApp } from '@/apps/clock';
import { clockManifest } from '@/apps/clock/manifest';
import { CalculatorApp } from '@/apps/calculator';
import { calculatorManifest } from '@/apps/calculator/manifest';
import { NotesApp } from '@/apps/notes';
import { notesManifest } from '@/apps/notes/manifest';
import { VoiceRecorderApp } from '@/apps/voice-recorder';
import { voiceRecorderManifest } from '@/apps/voice-recorder/manifest';
import { WeatherApp } from '@/apps/weather';
import { weatherManifest } from '@/apps/weather/manifest';
import { PoliceApp } from '@/apps/police';
import { policeManifest } from '@/apps/police/manifest';
import { PoetryApp } from '@/apps/poetry';
import { poetryManifest } from '@/apps/poetry/manifest';
import { BrowserApp } from '@/apps/browser';
import { browserManifest } from '@/apps/browser/manifest';
import { ChatApp } from '@/apps/chat';
import { chatManifest } from '@/apps/chat/manifest';
import { JusticeApp } from '@/apps/justice';
import { justiceManifest } from '@/apps/justice/manifest';
import { EmsApp } from '@/apps/ems';
import { emsManifest } from '@/apps/ems/manifest';
import { BusinessApp } from '@/apps/business';
import { businessManifest } from '@/apps/business/manifest';
import { RealEstateApp } from '@/apps/real-estate';
import { realEstateManifest } from '@/apps/real-estate/manifest';
import { VehiclesApp } from '@/apps/vehicles';
import { vehiclesManifest } from '@/apps/vehicles/manifest';
import { AviationApp } from '@/apps/aviation';
import { aviationManifest } from '@/apps/aviation/manifest';
import { MarineApp } from '@/apps/marine';
import { marineManifest } from '@/apps/marine/manifest';
import { ExchangeApp } from '@/apps/exchange';
import { exchangeManifest } from '@/apps/exchange/manifest';
import { PhoneApp } from '@/apps/phone';
import { phoneManifest } from '@/apps/phone/manifest';
import { ContactsApp } from '@/apps/contacts';
import { contactsManifest } from '@/apps/contacts/manifest';
import { MessagesApp } from '@/apps/messages';
import { messagesManifest } from '@/apps/messages/manifest';
import { MailApp } from '@/apps/mail';
import { mailManifest } from '@/apps/mail/manifest';
import { SimApp } from '@/apps/sim';
import { simManifest } from '@/apps/sim/manifest';
import { BankApp } from '@/apps/bank';
import { bankManifest } from '@/apps/bank/manifest';
import { IdentityApp } from '@/apps/identity';
import { identityManifest } from '@/apps/identity/manifest';

registerApp(
  {
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
  },
  SettingsApp
);

registerApp(gulfStoreManifest, GulfStoreApp);

const SYSTEM_APPS = [
  [mapsManifest, MapsApp],
  [cameraManifest, CameraApp],
  [galleryManifest, GalleryApp],
  [filesManifest, FilesApp],
  [calendarManifest, CalendarApp],
  [clockManifest, ClockApp],
  [calculatorManifest, CalculatorApp],
  [notesManifest, NotesApp],
  [voiceRecorderManifest, VoiceRecorderApp],
  [weatherManifest, WeatherApp],
] as const;

for (const [manifest, component] of SYSTEM_APPS) {
  registerApp(manifest, component);
}

registerApp(policeManifest, PoliceApp);
registerApp(poetryManifest, PoetryApp);
registerApp(browserManifest, BrowserApp);
registerApp(chatManifest, ChatApp);
registerApp(justiceManifest, JusticeApp);
registerApp(emsManifest, EmsApp);
registerApp(businessManifest, BusinessApp);
registerApp(realEstateManifest, RealEstateApp);
registerApp(vehiclesManifest, VehiclesApp);
registerApp(aviationManifest, AviationApp);
registerApp(marineManifest, MarineApp);
registerApp(exchangeManifest, ExchangeApp);
registerApp(phoneManifest, PhoneApp);
registerApp(contactsManifest, ContactsApp);
registerApp(messagesManifest, MessagesApp);
registerApp(mailManifest, MailApp);
registerApp(simManifest, SimApp);
registerApp(bankManifest, BankApp);
registerApp(identityManifest, IdentityApp);
