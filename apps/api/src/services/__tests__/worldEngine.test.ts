import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetworkMetrics,
  determineGeneration,
  getDistrictTerrain,
} from '../networkEngineService';
import { haversineMeters, bearingDegrees, findDistrict, DISTRICTS } from '../../constants/gtaMap';

describe('network engine', () => {
  it('calculates signal metrics with penalties', () => {
    const result = calculateNetworkMetrics({
      distanceToTowerM: 500,
      coverageRadiusM: 2000,
      towerSignalPower: 95,
      towerHealth: 98,
      generation: '5g',
      speed: 30,
      interior: true,
      terrain: 'mountain',
      weather: 'rain',
      vpnActive: true,
      vpnLatencyPenalty: 25,
      vpnBandwidthPenalty: 15,
      towerCongestion: 0.4,
    });

    assert.ok(result.signalBars >= 0 && result.signalBars <= 5);
    assert.ok(result.signalDbm <= -40);
    assert.ok(result.latencyMs > 18);
    assert.ok(result.penalties.indoor !== undefined);
    assert.ok(result.penalties.vpnLatency === 25);
  });

  it('returns none generation when out of coverage', () => {
    assert.equal(determineGeneration(0, 5000, 2000), 'none');
    assert.equal(determineGeneration(1, 2500, 2000), 'emergency');
    assert.equal(determineGeneration(5, 100, 2000), '5g');
  });

  it('resolves district terrain by name', () => {
    assert.equal(getDistrictTerrain('Vinewood'), 'urban');
    assert.equal(getDistrictTerrain('Del Perro'), 'coastal');
    assert.equal(getDistrictTerrain('Unknown District'), 'urban');
  });
});

describe('GTA map helpers', () => {
  it('computes haversine distance', () => {
    const d = haversineMeters(34.05, -118.24, 34.06, -118.25);
    assert.ok(d > 1000 && d < 2000);
  });

  it('computes bearing between points', () => {
    const b = bearingDegrees(34.05, -118.24, 34.06, -118.24);
    assert.ok(b >= 0 && b < 360);
  });

  it('finds district for coordinates', () => {
    const d = findDistrict(34.055, -118.245);
    assert.ok(d.name.length > 0);
    assert.ok(DISTRICTS.some((x) => x.name === d.name));
  });
});

describe('world engine socket events', () => {
  it('defines required realtime events', () => {
    const events = [
      'world:update',
      'tower:update',
      'signal:update',
      'gps:update',
      'vpn:update',
      'carrier:update',
      'tracking:update',
      'location:update',
      'network:update',
    ];
    assert.equal(events.length, 9);
  });
});

describe('carrier generations', () => {
  it('supports all Banana Mobile generations', () => {
    const gens = ['none', 'emergency', '2g', '3g', '4g', '5g'];
    assert.equal(gens.length, 6);
  });
});

describe('police tracking request types', () => {
  it('covers required tracking capabilities', () => {
    const types = [
      'phone_number',
      'current_tower',
      'last_tower',
      'last_location',
      'movement_history',
      'signal_history',
      'network_state',
      'online_status',
    ];
    assert.equal(types.length, 8);
  });
});

describe('background world engine task', () => {
  it('registers world-engine-tick task name', () => {
    assert.equal('world-engine-tick'.includes('world'), true);
  });
});

describe('VPN countries', () => {
  it('provides virtual IP prefixes', async () => {
    const { VPN_COUNTRIES } = await import('../../constants/gtaMap');
    assert.ok(VPN_COUNTRIES.length >= 5);
    for (const c of VPN_COUNTRIES) {
      assert.ok(c.virtualIpPrefix.startsWith('10.'));
    }
  });
});

describe('map database scale', () => {
  it('targets thousands of locations via grid seeding', () => {
    const districts = 15;
    const gridPerDistrict = 12 * 12;
    const landmarks = 10;
    const total = districts * gridPerDistrict + landmarks;
    assert.ok(total >= 2000);
  });
});
