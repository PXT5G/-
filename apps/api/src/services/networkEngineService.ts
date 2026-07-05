import type { ConnectionGeneration } from '../constants/gtaMap';
import { DISTRICTS } from '../constants/gtaMap';
import type { WeatherType } from '../constants/gtaMap';

export interface NetworkCalculationInput {
  distanceToTowerM: number;
  coverageRadiusM: number;
  towerSignalPower: number;
  towerHealth: number;
  generation: ConnectionGeneration;
  speed: number;
  interior: boolean;
  terrain: string;
  weather: WeatherType;
  vpnActive: boolean;
  vpnLatencyPenalty: number;
  vpnBandwidthPenalty: number;
  towerCongestion: number;
}

export interface NetworkCalculationResult {
  signalBars: number;
  signalDbm: number;
  latencyMs: number;
  pingMs: number;
  bandwidthMbps: number;
  packetLoss: number;
  jitterMs: number;
  congestion: number;
  connectionType: string;
  penalties: Record<string, number>;
}

const GENERATION_BASE: Record<ConnectionGeneration, { latency: number; bandwidth: number; maxBars: number }> = {
  none: { latency: 9999, bandwidth: 0, maxBars: 0 },
  emergency: { latency: 500, bandwidth: 0.1, maxBars: 1 },
  '2g': { latency: 300, bandwidth: 0.5, maxBars: 2 },
  '3g': { latency: 120, bandwidth: 5, maxBars: 3 },
  '4g': { latency: 45, bandwidth: 50, maxBars: 4 },
  '5g': { latency: 18, bandwidth: 200, maxBars: 5 },
};

export function calculateNetworkMetrics(input: NetworkCalculationInput): NetworkCalculationResult {
  const base = GENERATION_BASE[input.generation];
  const penalties: Record<string, number> = {};

  const distanceRatio = Math.min(1, input.distanceToTowerM / input.coverageRadiusM);
  const distancePenalty = distanceRatio * 30;
  penalties.distance = distanceRatio;

  let signalDbm = -50 - distancePenalty - (100 - input.towerSignalPower) * 0.3 - (100 - input.towerHealth) * 0.2;
  penalties.towerHealth = (100 - input.towerHealth) / 100;

  if (input.interior) {
    signalDbm -= 12;
    penalties.indoor = 12;
  }

  if (input.terrain === 'mountain') {
    signalDbm -= 18;
    penalties.mountain = 18;
  } else if (input.terrain === 'coastal' && input.distanceToTowerM > input.coverageRadiusM * 0.7) {
    signalDbm -= 8;
    penalties.water = 8;
  }

  if (input.terrain === 'industrial') {
    signalDbm -= 5;
    penalties.tunnel = 5;
  }

  if (input.weather === 'rain' || input.weather === 'thunderstorm') {
    signalDbm -= 6;
    penalties.weather = 6;
  } else if (input.weather === 'fog' || input.weather === 'smog') {
    signalDbm -= 4;
    penalties.weather = 4;
  }

  if (input.speed > 25) {
    const movePenalty = Math.min(10, (input.speed - 25) * 0.2);
    signalDbm -= movePenalty;
    penalties.movement = movePenalty;
  }

  const congestion = Math.min(1, input.towerCongestion);
  signalDbm -= congestion * 15;
  penalties.congestion = congestion;

  signalDbm = Math.max(-120, Math.min(-40, signalDbm));

  let signalBars = 0;
  if (input.generation !== 'none') {
    if (signalDbm >= -70) signalBars = base.maxBars;
    else if (signalDbm >= -80) signalBars = Math.max(1, base.maxBars - 1);
    else if (signalDbm >= -90) signalBars = Math.max(1, base.maxBars - 2);
    else if (signalDbm >= -100) signalBars = 1;
    else signalBars = input.generation === 'emergency' ? 1 : 0;
  }

  let latencyMs = base.latency + distanceRatio * 20 + congestion * 30;
  let bandwidthMbps = base.bandwidth * (1 - distanceRatio * 0.4) * (1 - congestion * 0.3);
  let packetLoss = congestion * 2 + (signalBars <= 1 ? 3 : 0);
  let jitterMs = 1 + congestion * 5 + (input.speed > 15 ? 2 : 0);

  if (input.vpnActive) {
    latencyMs += input.vpnLatencyPenalty;
    bandwidthMbps = Math.max(1, bandwidthMbps - input.vpnBandwidthPenalty);
    penalties.vpnLatency = input.vpnLatencyPenalty;
    penalties.vpnBandwidth = input.vpnBandwidthPenalty;
  }

  if (input.interior) {
    latencyMs += 8;
    bandwidthMbps *= 0.85;
  }

  return {
    signalBars,
    signalDbm: Math.round(signalDbm),
    latencyMs: Math.round(latencyMs),
    pingMs: Math.round(latencyMs * 0.9),
    bandwidthMbps: Math.round(bandwidthMbps * 10) / 10,
    packetLoss: Math.round(packetLoss * 100) / 100,
    jitterMs: Math.round(jitterMs * 10) / 10,
    congestion: Math.round(congestion * 100) / 100,
    connectionType: input.generation === 'none' ? 'none' : input.generation === 'emergency' ? 'emergency' : 'cellular',
    penalties,
  };
}

export function determineGeneration(signalBars: number, distanceM: number, coverageM: number): ConnectionGeneration {
  if (distanceM > coverageM * 1.5) return 'none';
  if (signalBars <= 0) return 'none';
  if (signalBars === 1 && distanceM > coverageM) return 'emergency';
  if (signalBars <= 2) return '2g';
  if (signalBars === 3) return '3g';
  if (signalBars === 4) return '4g';
  return '5g';
}

export function getDistrictTerrain(districtName: string): string {
  const district = DISTRICTS.find((d) => d.name === districtName);
  return district?.terrain ?? 'urban';
}
