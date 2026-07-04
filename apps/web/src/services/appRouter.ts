'use client';

import type { AppManifest } from '@/types';

type AppComponent = React.ComponentType<{ appId?: string; appName?: string }>;

const appRegistry = new Map<string, AppManifest>();
const componentRegistry = new Map<string, AppComponent>();

export function registerApp(manifest: AppManifest, component?: AppComponent): void {
  appRegistry.set(manifest.bundleId, manifest);
  if (component) {
    componentRegistry.set(manifest.bundleId, component);
  }
}

export function getApp(bundleId: string): AppManifest | undefined {
  return appRegistry.get(bundleId);
}

export function getAppComponent(bundleId: string): AppComponent | undefined {
  return componentRegistry.get(bundleId);
}

export function getAllApps(): AppManifest[] {
  return Array.from(appRegistry.values());
}

export function isAppRegistered(bundleId: string): boolean {
  return appRegistry.has(bundleId);
}

export function getAppRoute(bundleId: string): string | undefined {
  return appRegistry.get(bundleId)?.route;
}
