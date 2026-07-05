import { create } from 'zustand';
import type { WidgetInstance, WidgetDefinition } from '@/types';

interface WidgetState {
  definitions: WidgetDefinition[];
  instances: WidgetInstance[];
  registerWidget: (definition: WidgetDefinition) => void;
  addInstance: (instance: WidgetInstance) => void;
  removeInstance: (id: string) => void;
  updateInstance: (id: string, updates: Partial<WidgetInstance>) => void;
  getInstancesForPage: (pageIndex: number) => WidgetInstance[];
}

export const useWidgetStore = create<WidgetState>((set, get) => ({
  definitions: [
    {
      id: 'clock-widget',
      appId: 'system',
      name: 'Clock',
      sizes: ['small', 'medium'],
      defaultSize: 'small',
    },
    {
      id: 'weather-widget',
      appId: 'system',
      name: 'Weather',
      sizes: ['medium', 'large'],
      defaultSize: 'medium',
    },
    {
      id: 'battery-widget',
      appId: 'system',
      name: 'Battery',
      sizes: ['small'],
      defaultSize: 'small',
    },
  ],
  instances: [],

  registerWidget: (definition) =>
    set((s) => ({
      definitions: [...s.definitions.filter((d) => d.id !== definition.id), definition],
    })),

  addInstance: (instance) =>
    set((s) => ({ instances: [...s.instances, instance] })),

  removeInstance: (id) =>
    set((s) => ({ instances: s.instances.filter((i) => i.id !== id) })),

  updateInstance: (id, updates) =>
    set((s) => ({
      instances: s.instances.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),

  getInstancesForPage: (pageIndex) =>
    get().instances.filter((i) => i.pageIndex === pageIndex),
}));
