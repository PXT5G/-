/** Los Santos map constants — BananaOS World Engine coordinate space */

export const WORLD_REGION = 'San Andreas';
export const WORLD_CITY = 'Los Santos';
export const DEFAULT_CARRIER = 'Banana Mobile';

export const MAP_BOUNDS = {
  minLat: 33.95,
  maxLat: 34.15,
  minLng: -118.35,
  maxLng: -118.12,
  centerLat: 34.0522,
  centerLng: -118.2437,
};

export type ConnectionGeneration = 'none' | 'emergency' | '2g' | '3g' | '4g' | '5g';

export interface DistrictDef {
  id: string;
  name: string;
  zone: string;
  postalPrefix: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  terrain: 'urban' | 'coastal' | 'industrial' | 'mountain' | 'rural';
}

export const DISTRICTS: DistrictDef[] = [
  { id: 'vinewood', name: 'Vinewood', zone: 'North Los Santos', postalPrefix: '90028', bounds: { minLat: 34.10, maxLat: 34.15, minLng: -118.32, maxLng: -118.26 }, terrain: 'urban' },
  { id: 'rockford-hills', name: 'Rockford Hills', zone: 'West Los Santos', postalPrefix: '90069', bounds: { minLat: 34.08, maxLat: 34.12, minLng: -118.35, maxLng: -118.30 }, terrain: 'urban' },
  { id: 'del-perro', name: 'Del Perro', zone: 'West Los Santos', postalPrefix: '90291', bounds: { minLat: 34.04, maxLat: 34.08, minLng: -118.35, maxLng: -118.30 }, terrain: 'coastal' },
  { id: 'vespucci', name: 'Vespucci', zone: 'West Los Santos', postalPrefix: '90291', bounds: { minLat: 34.00, maxLat: 34.05, minLng: -118.32, maxLng: -118.27 }, terrain: 'coastal' },
  { id: 'little-seoul', name: 'Little Seoul', zone: 'Central Los Santos', postalPrefix: '90012', bounds: { minLat: 34.04, maxLat: 34.07, minLng: -118.28, maxLng: -118.24 }, terrain: 'urban' },
  { id: 'downtown', name: 'Downtown Los Santos', zone: 'Central Los Santos', postalPrefix: '90014', bounds: { minLat: 34.04, maxLat: 34.07, minLng: -118.26, maxLng: -118.22 }, terrain: 'urban' },
  { id: 'pillbox-hill', name: 'Pillbox Hill', zone: 'Central Los Santos', postalPrefix: '90013', bounds: { minLat: 34.05, maxLat: 34.08, minLng: -118.26, maxLng: -118.22 }, terrain: 'urban' },
  { id: 'strawberry', name: 'Strawberry', zone: 'South Los Santos', postalPrefix: '90003', bounds: { minLat: 34.00, maxLat: 34.04, minLng: -118.28, maxLng: -118.24 }, terrain: 'urban' },
  { id: 'davis', name: 'Davis', zone: 'South Los Santos', postalPrefix: '90011', bounds: { minLat: 33.98, maxLat: 34.02, minLng: -118.28, maxLng: -118.23 }, terrain: 'urban' },
  { id: 'rancho', name: 'Rancho', zone: 'South Los Santos', postalPrefix: '90001', bounds: { minLat: 33.95, maxLat: 33.99, minLng: -118.26, maxLng: -118.21 }, terrain: 'urban' },
  { id: 'la-mesa', name: 'La Mesa', zone: 'East Los Santos', postalPrefix: '90023', bounds: { minLat: 34.00, maxLat: 34.04, minLng: -118.22, maxLng: -118.17 }, terrain: 'industrial' },
  { id: 'cypress-flats', name: 'Cypress Flats', zone: 'East Los Santos', postalPrefix: '90058', bounds: { minLat: 33.98, maxLat: 34.02, minLng: -118.20, maxLng: -118.15 }, terrain: 'industrial' },
  { id: 'el-burro', name: 'El Burro Heights', zone: 'East Los Santos', postalPrefix: '90022', bounds: { minLat: 33.96, maxLat: 34.00, minLng: -118.18, maxLng: -118.12 }, terrain: 'rural' },
  { id: 'port', name: 'Port of Los Santos', zone: 'South Los Santos', postalPrefix: '90731', bounds: { minLat: 33.95, maxLat: 33.99, minLng: -118.30, maxLng: -118.24 }, terrain: 'industrial' },
  { id: 'la-puerta', name: 'La Puerta', zone: 'South Los Santos', postalPrefix: '90293', bounds: { minLat: 33.97, maxLat: 34.01, minLng: -118.32, maxLng: -118.28 }, terrain: 'coastal' },
];

export const STREET_NAMES = [
  'Vinewood Boulevard', 'Del Perro Freeway', 'Olympic Freeway', 'Innocence Boulevard',
  'Alta Street', 'Vespucci Boulevard', 'San Andreas Avenue', 'Power Street',
  'Crusade Road', 'Carson Avenue', 'Davis Avenue', 'Roy Lowenstein Boulevard',
  'El Rancho Boulevard', 'Popular Street', 'Mirror Park Boulevard', 'East Galileo Avenue',
  'North Rockford Drive', 'South Rockford Drive', 'Marathon Avenue', 'Heritage Way',
  'Morningwood Boulevard', 'Bay City Avenue', 'Palomino Avenue', 'Ginger Street',
  'Integrity Way', 'Swiss Street', 'Peaceful Street', 'Low Power Street',
  'Adam\'s Apple Boulevard', 'Dutch London Street', 'Greenwich Parkway', 'Exceptionalists Way',
];

export const LANDMARKS = [
  { id: 'maze-bank', name: 'Maze Bank Tower', district: 'pillbox-hill', lat: 34.062, lng: -118.252, category: 'landmark' },
  { id: 'lspd-mission-row', name: 'LSPD Mission Row', district: 'davis', lat: 33.995, lng: -118.255, category: 'government' },
  { id: 'pillbox-medical', name: 'Pillbox Hill Medical Center', district: 'pillbox-hill', lat: 34.058, lng: -118.248, category: 'hospital' },
  { id: 'lsia', name: 'Los Santos International Airport', district: 'la-puerta', lat: 33.975, lng: -118.305, category: 'airport' },
  { id: 'vanilla-unicorn', name: 'Vanilla Unicorn', district: 'strawberry', lat: 34.012, lng: -118.268, category: 'business' },
  { id: 'vinewood-sign', name: 'Vinewood Sign', district: 'vinewood', lat: 34.128, lng: -118.290, category: 'landmark' },
  { id: 'del-perro-pier', name: 'Del Perro Pier', district: 'del-perro', lat: 34.045, lng: -118.330, category: 'landmark' },
  { id: 'legion-square', name: 'Legion Square', district: 'downtown', lat: 34.055, lng: -118.245, category: 'park' },
  { id: 'banana-hq', name: 'Banana Mobile HQ', district: 'downtown', lat: 34.053, lng: -118.240, category: 'business' },
  { id: 'mirror-park', name: 'Mirror Park', district: 'la-mesa', lat: 34.025, lng: -118.195, category: 'park' },
];

export const SAFE_ZONES = [
  { id: 'pillbox-hospital', name: 'Pillbox Hospital Zone', lat: 34.058, lng: -118.248, radiusM: 200 },
  { id: 'lspd-hq', name: 'LSPD HQ Zone', lat: 33.995, lng: -118.255, radiusM: 150 },
];

export const RESTRICTED_ZONES = [
  { id: 'fort-zancudo', name: 'Fort Zancudo Perimeter', lat: 34.12, lng: -118.34, radiusM: 3000 },
  { id: 'lsia-secure', name: 'LSIA Secure Area', lat: 33.975, lng: -118.305, radiusM: 800 },
];

export const WEATHER_TYPES = ['clear', 'clouds', 'fog', 'rain', 'thunderstorm', 'smog'] as const;
export type WeatherType = typeof WEATHER_TYPES[number];

export const VPN_COUNTRIES = [
  { code: 'US', name: 'United States', virtualIpPrefix: '10.8.0' },
  { code: 'CH', name: 'Switzerland', virtualIpPrefix: '10.9.0' },
  { code: 'JP', name: 'Japan', virtualIpPrefix: '10.10.0' },
  { code: 'DE', name: 'Germany', virtualIpPrefix: '10.11.0' },
  { code: 'NL', name: 'Netherlands', virtualIpPrefix: '10.12.0' },
];

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export function findDistrict(lat: number, lng: number): DistrictDef {
  for (const d of DISTRICTS) {
    const b = d.bounds;
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) {
      return d;
    }
  }
  return DISTRICTS.find((d) => d.id === 'downtown')!;
}

export function isInSafeZone(lat: number, lng: number): boolean {
  return SAFE_ZONES.some((z) => haversineMeters(lat, lng, z.lat, z.lng) <= z.radiusM);
}

export function isInRestrictedZone(lat: number, lng: number): boolean {
  return RESTRICTED_ZONES.some((z) => haversineMeters(lat, lng, z.lat, z.lng) <= z.radiusM);
}
