/** GULF SIM Manager — com.gulfos.sim */

export const SIM_APP_BUNDLE = 'com.gulfos.sim' as const;

export const NETWORK_GENERATIONS = ['2g', '3g', '4g', '5g', 'emergency'] as const;
export type NetworkGeneration = (typeof NETWORK_GENERATIONS)[number];

export const SIM_SLOTS = ['sim1', 'sim2'] as const;
export type SimSlot = (typeof SIM_SLOTS)[number];

export const SIM_PERMISSIONS = [
  'sim.access',
  'sim.configure',
  'sim.roaming',
  'sim.apn',
] as const;
export type SimPermission = (typeof SIM_PERMISSIONS)[number];

export const SIM_SOCKET_EVENTS = ['sim:status', 'sim:updated'] as const;
