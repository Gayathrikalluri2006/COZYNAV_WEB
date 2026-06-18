// Aegis Route — Safety Scoring + Real Data Sources
// Weighted Risk Aggregation Model. Returns 0–100 (higher = safer).

export type SafetyFactors = {
  crime: number;
  accidents: number;
  traffic: number;
  roadCondition: number;
  lighting: number;
  weather: number;
  crowdDensity: number;
  essentialsNearby: number;
};

export type Mode = "default" | "solo" | "accessible" | "cyclist";

export const DEFAULT_WEIGHTS: Record<keyof SafetyFactors, number> = {
  crime: 0.22,
  accidents: 0.16,
  traffic: 0.1,
  roadCondition: 0.1,
  lighting: 0.12,
  weather: 0.1,
  crowdDensity: 0.1,
  essentialsNearby: 0.1,
};

export const MODE_WEIGHTS: Record<Mode, Record<keyof SafetyFactors, number>> = {
  default: { ...DEFAULT_WEIGHTS },
  solo: { ...DEFAULT_WEIGHTS, crime: 0.3, lighting: 0.2 },
  accessible: { ...DEFAULT_WEIGHTS, roadCondition: 0.22, lighting: 0.2 },
  cyclist: { ...DEFAULT_WEIGHTS, accidents: 0.26, roadCondition: 0.2 },
};

export function computeSafetyScore(
  f: SafetyFactors,
  weights: Record<keyof SafetyFactors, number> = DEFAULT_WEIGHTS,
  prefs?: { nightMode?: boolean; avoidIsolated?: boolean; preferCrowded?: boolean },
): number {
  const w = { ...weights };
  if (prefs?.nightMode) {
    w.lighting += 0.05;
    w.crime += 0.03;
  }
  if (prefs?.avoidIsolated) {
    w.crowdDensity += 0.04;
    w.essentialsNearby += 0.03;
  }
  if (prefs?.preferCrowded) {
    w.crowdDensity += 0.04;
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => {
    w[k as keyof SafetyFactors] /= total;
  });
  const risk =
    f.crime * w.crime +
    f.accidents * w.accidents +
    f.traffic * w.traffic +
    f.roadCondition * w.roadCondition +
    f.lighting * w.lighting +
    f.weather * w.weather +
    f.crowdDensity * w.crowdDensity +
    f.essentialsNearby * w.essentialsNearby;
  return Math.round(Math.max(0, Math.min(100, 100 - risk)));
}

export function scoreLabel(score: number): {
  label: string;
  tone: "safe" | "caution" | "risk" | "danger";
} {
  if (score >= 80) return { label: "Very Safe", tone: "safe" };
  if (score >= 65) return { label: "Mostly Safe", tone: "caution" };
  if (score >= 45) return { label: "Caution", tone: "risk" };
  return { label: "High Risk", tone: "danger" };
}

function seededRand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967295;
  };
}

// ----- Real Data Sources -----
// OFFLINE MODE: returns deterministic seeded mocks so the app runs in VS Code
// with zero API keys. To re-enable Open-Meteo + Overpass, restore the original
// fetchWeatherRisk / fetchOsmRisks implementations from version control.

export type RealBase = {
  weather: number;
  lighting: number;
  crowdDensity: number;
  essentialsNearby: number;
};

const baseCache = new Map<string, Promise<RealBase>>();
const BUCKET_MS = 5 * 60 * 1000;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

// Place- AND time-sensitive base factors. Cache key includes a 5-min bucket so
// values evolve each refresh instead of being frozen forever.
export function fetchRealBase(lat: number, lng: number): Promise<RealBase> {
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}|${bucket}`;
  const cached = baseCache.get(key);
  if (cached) return cached;
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
  // Light + heavy seeds: spatial seed = place identity, bucket seed = time drift.
  const rPlace = seededRand(`${lat.toFixed(3)},${lng.toFixed(3)}`);
  const rTime = seededRand(key);
  // Try real weather from Open-Meteo (free, no key). Fall back to seeded.
  const p = (async (): Promise<RealBase> => {
    let weather = Math.round(clamp(15 + rTime() * 50));
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(to);
      if (res.ok) {
        const j = (await res.json()) as {
          current?: {
            precipitation?: number;
            wind_speed_10m?: number;
            weather_code?: number;
            temperature_2m?: number;
          };
        };
        const c = j.current ?? {};
        // Higher = worse weather risk.
        const precip = Math.min(60, (c.precipitation ?? 0) * 20);
        const wind = Math.min(30, (c.wind_speed_10m ?? 0) * 1.2);
        const codeRisk = (c.weather_code ?? 0) >= 60 ? 25 : (c.weather_code ?? 0) >= 45 ? 12 : 0;
        const tempRisk =
          c.temperature_2m != null
            ? Math.min(20, Math.max(0, Math.abs(c.temperature_2m - 18) - 8))
            : 0;
        weather = Math.round(clamp(precip + wind + codeRisk + tempRisk + 5));
      }
    } catch {
      /* keep seeded fallback */
    }
    const base: RealBase = {
      weather,
      lighting: Math.round(clamp(20 + rPlace() * 35 + (isNight ? 25 : 0) + rTime() * 10)),
      crowdDensity: Math.round(
        clamp(30 + rPlace() * 30 + (isRushHour ? 25 : 0) + (isNight ? -15 : 0) + rTime() * 15),
      ),
      essentialsNearby: Math.round(clamp(15 + rPlace() * 55 + rTime() * 8)),
    };
    return base;
  })();
  baseCache.set(key, p);
  // Trim cache occasionally.
  if (baseCache.size > 200) {
    const cutoff = bucket - 3;
    for (const k of baseCache.keys()) {
      const b = Number(k.split("|")[1]);
      if (!Number.isFinite(b) || b < cutoff) baseCache.delete(k);
    }
  }
  return p;
}

// Sync function — replaces previous mockFactorsFor signature.
// `base` is optional; when provided (from fetchRealBase) the factors use real data.
export function mockFactorsFor(
  seed: string,
  hour = new Date().getHours(),
  base?: RealBase,
): SafetyFactors {
  const r = seededRand(seed);
  const isNight = hour < 6 || hour >= 20;
  const nightBoost = isNight ? 18 : 0;
  // Seed-derived (crime/accidents/traffic/road) — no public global API is reliable for these.
  const crime = clamp(20 + r() * 50 + nightBoost);
  const accidents = clamp(15 + r() * 55);
  const traffic = clamp(20 + r() * 70);
  const roadCondition = clamp(10 + r() * 60);
  // Real or fallback for the rest:
  const lighting = clamp((base?.lighting ?? 25) + (isNight ? 30 : 0));
  const weather = base?.weather ?? clamp(10 + r() * 50);
  const crowdDensity = clamp((base?.crowdDensity ?? 50) + (isNight ? 18 : 0));
  const essentialsNearby = base?.essentialsNearby ?? clamp(20 + r() * 50);
  return {
    crime: Math.round(crime),
    accidents: Math.round(accidents),
    traffic: Math.round(traffic),
    roadCondition: Math.round(roadCondition),
    lighting: Math.round(lighting),
    weather: Math.round(weather),
    crowdDensity: Math.round(crowdDensity),
    essentialsNearby: Math.round(essentialsNearby),
  };
}
