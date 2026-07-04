import { WorldState } from '../database/models/WorldState';
import { WEATHER_TYPES } from '../constants/gtaMap';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { emitToUser } from './socketService';

const WEATHER_LABELS: Record<string, string> = {
  clear: 'Clear',
  clouds: 'Cloudy',
  fog: 'Foggy',
  rain: 'Rainy',
  thunderstorm: 'Thunderstorm',
  smog: 'Smog',
};

const WEATHER_TEMPS: Record<string, number> = {
  clear: 28, clouds: 22, fog: 16, rain: 18, thunderstorm: 20, smog: 24,
};

function generateHourly(condition: string, baseTemp: number) {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    tempC: baseTemp + Math.sin((h - 6) / 12 * Math.PI) * 5 + (Math.random() - 0.5) * 2,
    condition: h >= 6 && h <= 18 ? condition : condition === 'clear' ? 'clouds' : condition,
    rainProbability: condition === 'rain' ? 70 + Math.random() * 20 : condition === 'thunderstorm' ? 90 : Math.random() * 30,
    windKmh: 5 + Math.random() * 25,
    visibilityKm: condition === 'fog' ? 2 : condition === 'rain' ? 8 : 15,
  }));
}

function generateWeekly(condition: string, baseTemp: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    highC: baseTemp + (Math.random() - 0.5) * 6,
    lowC: baseTemp - 5 + (Math.random() - 0.5) * 4,
    condition: WEATHER_TYPES[(WEATHER_TYPES.indexOf(condition as never) + i) % WEATHER_TYPES.length],
    rainProbability: Math.random() * 60,
  }));
}

export async function getWeather(userId: string) {
  const world = await WorldState.findOne({ userId, deletedAt: null });
  const condition = world?.weather ?? 'clear';
  const district = world?.district ?? 'Downtown';
  const baseTemp = WEATHER_TEMPS[condition] ?? 22;

  const current = {
    condition,
    label: WEATHER_LABELS[condition] ?? condition,
    tempC: Math.round(baseTemp + (Math.random() - 0.5) * 3),
    feelsLikeC: Math.round(baseTemp - 1),
    humidity: 40 + Math.floor(Math.random() * 40),
    windKmh: Math.round(5 + Math.random() * 20),
    visibilityKm: condition === 'fog' ? 2 : 15,
    rainProbability: condition === 'rain' ? 80 : condition === 'thunderstorm' ? 95 : Math.round(Math.random() * 30),
    district,
    updatedAt: new Date().toISOString(),
  };

  const report = {
    current,
    hourly: generateHourly(condition, baseTemp),
    weekly: generateWeekly(condition, baseTemp),
    alerts: condition === 'thunderstorm' ? [{ type: 'severe', message: 'Thunderstorm warning in effect' }] : [],
  };

  emitToUser(userId, 'weather:update', report);
  return report;
}

export async function getWeatherForDistrict(district: string) {
  const condition = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
  const baseTemp = WEATHER_TEMPS[condition] ?? 22;
  return {
    district,
    condition,
    label: WEATHER_LABELS[condition],
    tempC: baseTemp,
    hourly: generateHourly(condition, baseTemp).slice(0, 12),
  };
}
