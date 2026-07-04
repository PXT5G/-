import crypto from 'crypto';
import { WorldLocation } from '../database/models/WorldLocation';
import { Street } from '../database/models/Street';
import { District } from '../database/models/District';
import {
  DISTRICTS,
  STREET_NAMES,
  LANDMARKS,
  haversineMeters,
  findDistrict,
  MAP_BOUNDS,
} from '../constants/gtaMap';

let seeded = false;

export async function seedMapDatabase(): Promise<{ locations: number; streets: number; districts: number }> {
  if (seeded) {
    const [locations, streets, districts] = await Promise.all([
      WorldLocation.countDocuments({ deletedAt: null }),
      Street.countDocuments({ deletedAt: null }),
      District.countDocuments({ deletedAt: null }),
    ]);
    return { locations, streets, districts };
  }

  const existing = await WorldLocation.countDocuments();
  if (existing > 100) {
    seeded = true;
    return { locations: existing, streets: await Street.countDocuments(), districts: await District.countDocuments() };
  }

  for (const d of DISTRICTS) {
    await District.findOneAndUpdate(
      { districtId: d.id },
      {
        districtId: d.id,
        name: d.name,
        zone: d.zone,
        postalPrefix: d.postalPrefix,
        minLat: d.bounds.minLat,
        maxLat: d.bounds.maxLat,
        minLng: d.bounds.minLng,
        maxLng: d.bounds.maxLng,
        terrain: d.terrain,
      },
      { upsert: true }
    );
  }

  const locations: Array<Record<string, unknown>> = [];

  for (const lm of LANDMARKS) {
    const district = DISTRICTS.find((d) => d.id === lm.district)!;
    locations.push({
      locationId: lm.id,
      name: lm.name,
      street: STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)],
      district: district.name,
      zone: district.zone,
      category: lm.category,
      latitude: lm.lat,
      longitude: lm.lng,
      boundingRadiusM: 100,
      postalCode: `${district.postalPrefix}-0001`,
      landmark: true,
      nearbyLocationIds: [],
      roadConnections: [],
    });
  }

  let locIndex = 0;
  for (const district of DISTRICTS) {
    const b = district.bounds;
    const latSteps = 12;
    const lngSteps = 12;

    for (let i = 0; i < latSteps; i++) {
      for (let j = 0; j < lngSteps; j++) {
        const lat = b.minLat + ((b.maxLat - b.minLat) * i) / latSteps + (Math.random() * 0.001);
        const lng = b.minLng + ((b.maxLng - b.minLng) * j) / lngSteps + (Math.random() * 0.001);
        const street = STREET_NAMES[(i + j + locIndex) % STREET_NAMES.length];
        const categories = ['residential', 'commercial', 'retail', 'office', 'parking', 'intersection'];
        const category = categories[(i + j) % categories.length];

        locations.push({
          locationId: `loc-${district.id}-${locIndex++}`,
          name: `${street} Block ${i * lngSteps + j + 1}`,
          street,
          district: district.name,
          zone: district.zone,
          category,
          latitude: lat,
          longitude: lng,
          boundingRadiusM: 40 + Math.floor(Math.random() * 60),
          postalCode: `${district.postalPrefix}-${String(1000 + locIndex).slice(-4)}`,
          landmark: false,
          nearbyLocationIds: [],
          roadConnections: [street],
        });
      }
    }
  }

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const nearby = locations
      .map((other, idx) => ({ idx, dist: haversineMeters(loc.latitude as number, loc.longitude as number, other.latitude as number, other.longitude as number) }))
      .filter((n) => n.idx !== i && n.dist < 500)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
      .map((n) => locations[n.idx].locationId as string);
    loc.nearbyLocationIds = nearby;
  }

  await WorldLocation.deleteMany({});
  await WorldLocation.insertMany(locations);

  const streets: Array<Record<string, unknown>> = [];
  for (const district of DISTRICTS) {
    for (let s = 0; s < 8; s++) {
      const name = STREET_NAMES[(streets.length + s) % STREET_NAMES.length];
      const b = district.bounds;
      streets.push({
        streetId: `st-${district.id}-${s}`,
        name,
        district: district.name,
        zone: district.zone,
        startLat: b.minLat + Math.random() * (b.maxLat - b.minLat) * 0.3,
        startLng: b.minLng + Math.random() * (b.maxLng - b.minLng) * 0.3,
        endLat: b.minLat + Math.random() * (b.maxLat - b.minLat) * 0.7 + (b.maxLat - b.minLat) * 0.3,
        endLng: b.minLng + Math.random() * (b.maxLng - b.minLng) * 0.7 + (b.maxLng - b.minLng) * 0.3,
        postalCode: district.postalPrefix,
      });
    }
  }
  await Street.deleteMany({});
  await Street.insertMany(streets);

  seeded = true;
  return { locations: locations.length, streets: streets.length, districts: DISTRICTS.length };
}

export async function searchLocations(query: {
  q?: string;
  district?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radiusM?: number;
  limit?: number;
}) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (query.district) filter.district = new RegExp(query.district, 'i');
  if (query.category) filter.category = query.category;
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { street: new RegExp(query.q, 'i') },
      { locationId: new RegExp(query.q, 'i') },
    ];
  }

  let results = await WorldLocation.find(filter).limit(query.limit ?? 50);

  if (query.lat !== undefined && query.lng !== undefined) {
    const radius = query.radiusM ?? 1000;
    results = results
      .map((r) => ({
        doc: r,
        dist: haversineMeters(query.lat!, query.lng!, r.latitude, r.longitude),
      }))
      .filter((r) => r.dist <= radius)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, query.limit ?? 50)
      .map((r) => r.doc);
  }

  return results.map(formatLocation);
}

export async function getLocationById(locationId: string) {
  const loc = await WorldLocation.findOne({ locationId, deletedAt: null });
  if (!loc) return null;
  const nearby = await WorldLocation.find({
    locationId: { $in: loc.nearbyLocationIds },
    deletedAt: null,
  }).limit(10);
  return {
    ...formatLocation(loc),
    nearby: nearby.map(formatLocation),
  };
}

export async function resolveNearestLocation(lat: number, lng: number) {
  const locations = await WorldLocation.find({ deletedAt: null }).limit(5000);
  let nearest = locations[0];
  let minDist = Infinity;
  for (const loc of locations) {
    const d = haversineMeters(lat, lng, loc.latitude, loc.longitude);
    if (d < minDist) {
      minDist = d;
      nearest = loc;
    }
  }
  return nearest ? { ...formatLocation(nearest), distanceM: minDist } : null;
}

export async function resolveStreetAt(lat: number, lng: number): Promise<string> {
  const nearest = await resolveNearestLocation(lat, lng);
  return nearest?.street ?? STREET_NAMES[0];
}

function formatLocation(loc: InstanceType<typeof WorldLocation>) {
  return {
    locationId: loc.locationId,
    name: loc.name,
    street: loc.street,
    district: loc.district,
    zone: loc.zone,
    category: loc.category,
    latitude: loc.latitude,
    longitude: loc.longitude,
    boundingRadiusM: loc.boundingRadiusM,
    nearbyLocationIds: loc.nearbyLocationIds,
    roadConnections: loc.roadConnections,
    postalCode: loc.postalCode,
    landmark: loc.landmark,
  };
}

export { findDistrict, MAP_BOUNDS };
