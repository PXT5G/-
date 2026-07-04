'use client';

import { useWeather } from '@/hooks/useSystemApps';
import { GlassPanel } from '@/components/ui/GlassPanel';

const WEATHER_ICONS: Record<string, string> = {
  clear: '☀️', clouds: '☁️', fog: '🌫️', rain: '🌧️', thunderstorm: '⛈️', smog: '😷',
};

export function WeatherApp() {
  const { data: weather, isLoading } = useWeather();

  if (isLoading || !weather) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-sky-900 to-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = weather.current as Record<string, unknown>;
  const hourly = (weather.hourly as Array<Record<string, unknown>>) ?? [];
  const weekly = (weather.weekly as Array<Record<string, unknown>>) ?? [];
  const alerts = (weather.alerts as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-sky-900/80 via-black to-black">
      <div className="p-6 pt-12">
        <p className="text-white/60 text-sm">{String(current.district)}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-6xl">{WEATHER_ICONS[String(current.condition)] ?? '🌤️'}</span>
          <div>
            <p className="text-6xl font-extralight text-white">{Number(current.tempC)}°</p>
            <p className="text-white/60">{String(current.label)} · Feels {Number(current.feelsLikeC)}°</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          <GlassPanel className="p-3 text-center" intensity="low">
            <p className="text-white/40 text-xs">Rain</p>
            <p className="text-white text-lg">{Number(current.rainProbability)}%</p>
          </GlassPanel>
          <GlassPanel className="p-3 text-center" intensity="low">
            <p className="text-white/40 text-xs">Wind</p>
            <p className="text-white text-lg">{Number(current.windKmh)} km/h</p>
          </GlassPanel>
          <GlassPanel className="p-3 text-center" intensity="low">
            <p className="text-white/40 text-xs">Visibility</p>
            <p className="text-white text-lg">{Number(current.visibilityKm)} km</p>
          </GlassPanel>
        </div>

        {alerts.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
            {alerts.map((a, i) => (
              <p key={i} className="text-red-300 text-sm">⚠️ {String(a.message)}</p>
            ))}
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-xs text-white/40 uppercase mb-3">Hourly</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {hourly.slice(0, 12).map((h) => (
              <GlassPanel key={Number(h.hour)} className="p-3 min-w-[70px] text-center flex-shrink-0" intensity="low">
                <p className="text-white/40 text-xs">{Number(h.hour)}:00</p>
                <p className="text-white text-lg my-1">{Math.round(Number(h.tempC))}°</p>
                <p className="text-white/40 text-[10px]">{Number(h.rainProbability).toFixed(0)}%</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <section className="mt-8 pb-8">
          <h2 className="text-xs text-white/40 uppercase mb-3">7-Day Forecast</h2>
          {weekly.map((d) => (
            <div key={String(d.day)} className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-white w-12">{String(d.day)}</span>
              <span className="text-2xl">{WEATHER_ICONS[String(d.condition)] ?? '☁️'}</span>
              <span className="text-white/40 text-sm">{Number(d.rainProbability).toFixed(0)}%</span>
              <span className="text-white tabular-nums">{Math.round(Number(d.lowC))}° / {Math.round(Number(d.highC))}°</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
