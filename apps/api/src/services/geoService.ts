/**
 * Real-world geolocation + weather service.
 * Resolves the device's physical position (browser GPS coords when provided,
 * otherwise server-side IP geolocation) and fetches live weather from
 * Open-Meteo. All external calls are proxied here so the client never
 * produces network/console errors.
 */

interface GeoWeather {
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  condition: string;
  label: string;
  icon: string;
}

export interface RealGeo {
  source: 'gps' | 'ip' | 'fallback';
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  timezone: string;
  weather: GeoWeather | null;
  updatedAt: string;
}

/** WMO weather interpretation codes → condition/label/icon */
const WMO: Record<number, { condition: string; label: string; icon: string }> = {
  0: { condition: 'clear', label: 'Clear', icon: '☀️' },
  1: { condition: 'clear', label: 'Mostly Clear', icon: '🌤️' },
  2: { condition: 'clouds', label: 'Partly Cloudy', icon: '⛅' },
  3: { condition: 'clouds', label: 'Overcast', icon: '☁️' },
  45: { condition: 'fog', label: 'Foggy', icon: '🌫️' },
  48: { condition: 'fog', label: 'Icy Fog', icon: '🌫️' },
  51: { condition: 'rain', label: 'Light Drizzle', icon: '🌦️' },
  53: { condition: 'rain', label: 'Drizzle', icon: '🌦️' },
  55: { condition: 'rain', label: 'Heavy Drizzle', icon: '🌧️' },
  61: { condition: 'rain', label: 'Light Rain', icon: '🌧️' },
  63: { condition: 'rain', label: 'Rain', icon: '🌧️' },
  65: { condition: 'rain', label: 'Heavy Rain', icon: '🌧️' },
  71: { condition: 'snow', label: 'Light Snow', icon: '🌨️' },
  73: { condition: 'snow', label: 'Snow', icon: '🌨️' },
  75: { condition: 'snow', label: 'Heavy Snow', icon: '❄️' },
  80: { condition: 'rain', label: 'Showers', icon: '🌦️' },
  81: { condition: 'rain', label: 'Rain Showers', icon: '🌧️' },
  82: { condition: 'rain', label: 'Violent Showers', icon: '⛈️' },
  95: { condition: 'thunderstorm', label: 'Thunderstorm', icon: '⛈️' },
  96: { condition: 'thunderstorm', label: 'Thunderstorm + Hail', icon: '⛈️' },
  99: { condition: 'thunderstorm', label: 'Severe Thunderstorm', icon: '⛈️' },
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: RealGeo }>();

async function fetchJson(url: string, timeoutMs = 6000): Promise<Record<string, unknown> | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'GULFOS/1.0' } });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function ipLocate(): Promise<{ lat: number; lon: number; city: string; region: string; country: string; timezone: string } | null> {
  const body = await fetchJson('https://ipwho.is/');
  if (!body || body.success === false) return null;
  const tz = body.timezone as { id?: string } | undefined;
  return {
    lat: Number(body.latitude),
    lon: Number(body.longitude),
    city: String(body.city ?? ''),
    region: String(body.region ?? ''),
    country: String(body.country ?? ''),
    timezone: String(tz?.id ?? ''),
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; region: string; country: string } | null> {
  const body = await fetchJson(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  if (!body) return null;
  return {
    city: String(body.city || body.locality || ''),
    region: String(body.principalSubdivision ?? ''),
    country: String(body.countryName ?? ''),
  };
}

async function fetchWeather(lat: number, lon: number): Promise<{ weather: GeoWeather; timezone: string } | null> {
  const body = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto',
  );
  const current = body?.current as Record<string, unknown> | undefined;
  if (!current) return null;
  const code = Number(current.weather_code ?? 0);
  const wmo = WMO[code] ?? { condition: 'clear', label: 'Clear', icon: '☀️' };
  return {
    timezone: String(body?.timezone ?? ''),
    weather: {
      tempC: Math.round(Number(current.temperature_2m ?? 0)),
      feelsLikeC: Math.round(Number(current.apparent_temperature ?? current.temperature_2m ?? 0)),
      humidity: Math.round(Number(current.relative_humidity_2m ?? 0)),
      windKmh: Math.round(Number(current.wind_speed_10m ?? 0)),
      condition: wmo.condition,
      label: wmo.label,
      icon: wmo.icon,
    },
  };
}

export async function getRealGeo(lat?: number, lon?: number): Promise<RealGeo> {
  const hasGps = typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon);
  const key = hasGps ? `gps:${lat!.toFixed(2)},${lon!.toFixed(2)}` : 'ip';
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  let source: RealGeo['source'] = 'fallback';
  let latitude = 25.2048;
  let longitude = 55.2708;
  let city = 'Dubai';
  let region = 'Dubai';
  let country = 'United Arab Emirates';
  let timezone = 'Asia/Dubai';

  if (hasGps) {
    source = 'gps';
    latitude = lat!;
    longitude = lon!;
    const rev = await reverseGeocode(latitude, longitude);
    if (rev?.city) {
      city = rev.city;
      region = rev.region;
      country = rev.country;
    }
  } else {
    const ip = await ipLocate();
    if (ip && Number.isFinite(ip.lat)) {
      source = 'ip';
      latitude = ip.lat;
      longitude = ip.lon;
      city = ip.city || city;
      region = ip.region || region;
      country = ip.country || country;
      timezone = ip.timezone || timezone;
    }
  }

  const wx = await fetchWeather(latitude, longitude);
  if (wx?.timezone) timezone = wx.timezone;

  const data: RealGeo = {
    source,
    latitude,
    longitude,
    city,
    region,
    country,
    timezone,
    weather: wx?.weather ?? null,
    updatedAt: new Date().toISOString(),
  };
  cache.set(key, { at: Date.now(), data });
  return data;
}
