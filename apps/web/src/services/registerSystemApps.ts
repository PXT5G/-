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
