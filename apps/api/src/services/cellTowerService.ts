import crypto from 'crypto';
import { CellTower } from '../database/models/CellTower';
import { DISTRICTS, DEFAULT_CARRIER, haversineMeters } from '../constants/gtaMap';

let towersSeeded = false;

export async function seedCellTowers(): Promise<number> {
  if (towersSeeded) return CellTower.countDocuments({ deletedAt: null });

  const existing = await CellTower.countDocuments();
  if (existing > 10) {
    towersSeeded = true;
    return existing;
  }

  const towers: Array<Record<string, unknown>> = [];
  let idx = 0;

  for (const district of DISTRICTS) {
    const b = district.bounds;
    const towerCount = district.terrain === 'urban' ? 4 : district.terrain === 'coastal' ? 3 : 2;

    for (let t = 0; t < towerCount; t++) {
      const lat = b.minLat + Math.random() * (b.maxLat - b.minLat);
      const lng = b.minLng + Math.random() * (b.maxLng - b.minLng);
      const bands = ['n78', 'n41', 'b3', 'b7', 'n5'];
      towers.push({
        towerUuid: crypto.randomUUID(),
        towerName: `BM-${district.id.toUpperCase()}-${String(t + 1).padStart(2, '0')}`,
        latitude: lat,
        longitude: lng,
        coverageRadiusM: district.terrain === 'urban' ? 1800 : 2800,
        signalPower: 85 + Math.floor(Math.random() * 15),
        frequencyBand: bands[idx % bands.length],
        carrier: DEFAULT_CARRIER,
        towerHealth: 90 + Math.floor(Math.random() * 10),
        currentUsers: Math.floor(Math.random() * 50),
        maxUsers: 500,
        status: 'online',
        maintenance: false,
        district: district.name,
      });
      idx++;
    }
  }

  await CellTower.deleteMany({});
  await CellTower.insertMany(towers);
  towersSeeded = true;
  return towers.length;
}

export async function findNearestTower(lat: number, lng: number) {
  const towers = await CellTower.find({ status: { $in: ['online', 'degraded'] }, deletedAt: null });
  let nearest = towers[0];
  let minDist = Infinity;

  for (const tower of towers) {
    const d = haversineMeters(lat, lng, tower.latitude, tower.longitude);
    if (d < minDist && d <= tower.coverageRadiusM) {
      minDist = d;
      nearest = tower;
    }
  }

  if (!nearest) {
    for (const tower of towers) {
      const d = haversineMeters(lat, lng, tower.latitude, tower.longitude);
      if (d < minDist) {
        minDist = d;
        nearest = tower;
      }
    }
  }

  return nearest ? { tower: formatTower(nearest), distanceM: minDist } : null;
}

export async function handoffTower(
  userId: string,
  lat: number,
  lng: number,
  currentTowerUuid?: string
): Promise<{ tower: ReturnType<typeof formatTower>; handoff: boolean }> {
  const nearest = await findNearestTower(lat, lng);
  if (!nearest) throw new Error('NO_TOWER_COVERAGE');

  const handoff = currentTowerUuid !== undefined && currentTowerUuid !== nearest.tower.towerUuid;

  if (handoff && currentTowerUuid) {
    await CellTower.findOneAndUpdate({ towerUuid: currentTowerUuid }, { $inc: { currentUsers: -1 } });
  }

  await CellTower.findOneAndUpdate(
    { towerUuid: nearest.tower.towerUuid },
    { $inc: { currentUsers: handoff ? 1 : 0 } }
  );

  return { tower: nearest.tower, handoff };
}

export async function getTowersNearby(lat: number, lng: number, radiusM = 5000) {
  const towers = await CellTower.find({ deletedAt: null });
  return towers
    .map((t) => ({
      ...formatTower(t),
      distanceM: haversineMeters(lat, lng, t.latitude, t.longitude),
    }))
    .filter((t) => t.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
}

export async function getTowerByUuid(towerUuid: string) {
  const tower = await CellTower.findOne({ towerUuid, deletedAt: null });
  return tower ? formatTower(tower) : null;
}

function formatTower(t: InstanceType<typeof CellTower>) {
  return {
    towerUuid: t.towerUuid,
    towerName: t.towerName,
    latitude: t.latitude,
    longitude: t.longitude,
    coverageRadiusM: t.coverageRadiusM,
    signalPower: t.signalPower,
    frequencyBand: t.frequencyBand,
    carrier: t.carrier,
    towerHealth: t.towerHealth,
    currentUsers: t.currentUsers,
    maxUsers: t.maxUsers,
    status: t.status,
    maintenance: t.maintenance,
    district: t.district,
  };
}
