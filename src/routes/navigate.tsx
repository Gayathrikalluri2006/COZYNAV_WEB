import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SafetyBadge } from "@/components/SafetyBadge";
import { MapWrapper, type MapRoute, type MapIncident } from "@/components/MapWrapper";
import {
  computeSafetyScore,
  mockFactorsFor,
  scoreLabel,
  fetchRealBase,
  type SafetyFactors,
} from "@/lib/safety";
import { geocode, getRoutes, type RoutePath } from "@/lib/geocode";
import { supabase } from "@/integrations/supabase/client";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";
import { Search, Loader2, Bookmark, AlertTriangle, Moon, Users, Footprints } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/navigate")({
  head: () => ({
    meta: [
      { title: "Navigate · Aegis Route" },
      {
        name: "description",
        content: "Find the safest route between any two places in the world.",
      },
    ],
  }),
  component: NavigatePage,
});

type ScoredRoute = RoutePath & { id: string; score: number; factors: SafetyFactors };

// Bucket time into 5-minute windows so seeded values change each refresh.
function timeBucket() {
  return Math.floor(Date.now() / (5 * 60 * 1000));
}

function NavigatePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<ScoredRoute[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [prefs, setPrefs] = useState({ nightMode: true, avoidIsolated: true, preferCrowded: true });
  const [refreshTick, setRefreshTick] = useState(0);

  // Auto-refresh every 5 minutes — re-fetches real factors per place + new time bucket.
  useEffect(() => {
    const t = setInterval(() => setRefreshTick((x) => x + 1), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Recompute factors (per-place + per-time) AND scores when prefs/tick change.
  useEffect(() => {
    if (!routes.length) return;
    let cancelled = false;
    (async () => {
      const bucket = timeBucket();
      const hour = new Date().getHours();
      const updated = await Promise.all(
        routes.map(async (r) => {
          const mid = r.coordinates[Math.floor(r.coordinates.length / 2)] ?? r.coordinates[0];
          const base = await fetchRealBase(mid[0], mid[1]);
          const seed = `${mid[0].toFixed(3)},${mid[1].toFixed(3)}|${r.id}|${bucket}`;
          const factors = mockFactorsFor(seed, hour, base);
          return { ...r, factors, score: computeSafetyScore(factors, undefined, prefs) };
        }),
      );
      if (!cancelled) setRoutes(updated);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, refreshTick]);

  // Load community incidents + subscribe to realtime changes.
  useEffect(() => {
    let active = true;
    const load = () => {
      supabase
        .from("incident_reports")
        .select("id,lat,lng,type,severity")
        .limit(500)
        .then(({ data }) => {
          if (active && data)
            setIncidents(
              data.map((d) => ({
                id: d.id,
                lat: d.lat,
                lng: d.lng,
                type: d.type,
                severity: d.severity,
              })),
            );
        });
    };
    load();
    const channel = supabase
      .channel("incident_reports-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () => {
        load();
        setRefreshTick((x) => x + 1); // also re-score routes when new incidents land
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setLoading(true);
    try {
      const [a, b] = await Promise.all([geocode(origin), geocode(destination)]);
      if (!a || !b) {
        toast.error("Could not find one of those places.");
        return;
      }
      const paths = await getRoutes(a, b);
      if (!paths.length) {
        toast.error("No routes found between these points.");
        return;
      }
      const bucket = timeBucket();
      const hour = new Date().getHours();
      const scored: ScoredRoute[] = await Promise.all(
        paths.slice(0, 3).map(async (p, i) => {
          const mid = p.coordinates[Math.floor(p.coordinates.length / 2)] ?? p.coordinates[0];
          const base = await fetchRealBase(mid[0], mid[1]);
          const seed = `${mid[0].toFixed(3)},${mid[1].toFixed(3)}|r${i}|${bucket}`;
          const factors = mockFactorsFor(seed, hour, base);
          return {
            ...p,
            id: `r${i}`,
            factors,
            score: computeSafetyScore(factors, undefined, prefs),
          };
        }),
      );
      // sort safest first
      scored.sort((x, y) => y.score - x.score);
      setRoutes(scored);
      setActiveId(scored[0].id);
    } catch {
      toast.error("Routing failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const mapRoutes: MapRoute[] = useMemo(
    () =>
      routes.map((r) => ({
        id: r.id,
        coordinates: r.coordinates,
        score: r.score,
        active: r.id === activeId,
      })),
    [routes, activeId],
  );

  const active = routes.find((r) => r.id === activeId);

  async function saveRoute() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to save routes.");
      return;
    }
    if (!active || !routes.length) return;
    const first = active.coordinates[0];
    const last = active.coordinates[active.coordinates.length - 1];
    const { error } = await supabase.from("saved_routes").insert({
      user_id: user.id,
      label: `${origin} → ${destination}`,
      origin_text: origin,
      destination_text: destination,
      origin_lat: first[0],
      origin_lng: first[1],
      dest_lat: last[0],
      dest_lng: last[1],
      last_safety_score: active.score,
    });
    if (error) toast.error(error.message);
    else toast.success("Route saved");
  }

  return (
    <div className="flex min-h-screen flex-col animate-in fade-in duration-300">
      <SiteHeader />

      <div className="grid flex-1 lg:grid-cols-[420px_1fr]">
        {/* SIDEBAR */}
        <aside className="border-r border-border/60 bg-card/40 backdrop-blur">
          <div className="space-y-5 p-5">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                Route Engine
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold">Plan a safer trip</h1>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <PlaceAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder="From — e.g. Eiffel Tower, Paris"
                dotClass="bg-[var(--safe)]"
              />
              <PlaceAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder="To — e.g. Times Square, NYC"
                dotClass="bg-destructive"
              />
              <button
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Computing routes…" : "Find safest route"}
              </button>
            </form>

            {/* Preferences */}
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Personalization
              </div>
              <div className="space-y-1.5">
                {(
                  [
                    ["nightMode", Moon, "Night-mode safety"],
                    ["avoidIsolated", Footprints, "Avoid isolated roads"],
                    ["preferCrowded", Users, "Prefer crowded zones"],
                  ] as const
                ).map(([key, Icon, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-accent/40"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Results */}
            {active && (
              <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Active route
                    </div>
                    <div className="font-display text-base font-semibold">
                      {active.distanceKm.toFixed(1)} km · {Math.round(active.durationMin)} min
                    </div>
                  </div>
                  <button
                    onClick={saveRoute}
                    className="rounded-lg border border-border bg-card p-2 hover:border-primary/50"
                    title="Save"
                  >
                    <Bookmark className="h-4 w-4 text-primary" />
                  </button>
                </div>
                <div className="my-4 grid place-items-center">
                  <SafetyBadge score={active.score} size="lg" />
                </div>
                <FactorsList factors={active.factors} />
              </div>
            )}

            {routes.length > 1 && (
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Compare routes
                </div>
                <div className="space-y-2">
                  {routes.map((r, i) => {
                    const { label, tone } = scoreLabel(r.score);
                    const c =
                      tone === "safe"
                        ? "var(--safe)"
                        : tone === "caution"
                          ? "var(--caution)"
                          : tone === "risk"
                            ? "var(--risk)"
                            : "var(--danger)";
                    return (
                      <button
                        key={r.id}
                        onClick={() => setActiveId(r.id)}
                        className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${r.id === activeId ? "border-primary bg-primary/5" : "border-border bg-background/40 hover:border-border/80"}`}
                      >
                        <div className="flex items-center gap-3">
                          <SafetyBadge score={r.score} size="sm" />
                          <div>
                            <div className="font-display text-sm font-semibold">Option {i + 1}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
                            </div>
                          </div>
                        </div>
                        <div
                          className="font-mono text-[10px] uppercase tracking-wider"
                          style={{ color: c }}
                        >
                          {label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {active && active.score < 50 && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="text-xs">
                  <div className="font-semibold text-destructive">High-risk route ahead</div>
                  <div className="text-muted-foreground">
                    Consider waiting or picking a safer alternative.
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAP */}
        <main className="relative min-h-[60vh]">
          <MapWrapper routes={mapRoutes} incidents={incidents} fit={routes.length > 0} />
          {!routes.length && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-2xl border border-border bg-card/80 px-6 py-4 text-center backdrop-blur">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Aegis Route
                </div>
                <div className="mt-1 font-display text-base">
                  Enter origin & destination to start
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FactorsList({ factors }: { factors: SafetyFactors }) {
  const items: [string, number][] = [
    ["Crime risk", factors.crime],
    ["Accidents", factors.accidents],
    ["Traffic", factors.traffic],
    ["Road condition", factors.roadCondition],
    ["Lighting", factors.lighting],
    ["Weather", factors.weather],
    ["Crowd density", factors.crowdDensity],
    ["Essentials nearby", factors.essentialsNearby],
  ];
  return (
    <div className="space-y-1.5">
      {items.map(([label, v]) => {
        const tone =
          v < 35
            ? "var(--safe)"
            : v < 60
              ? "var(--caution)"
              : v < 80
                ? "var(--risk)"
                : "var(--danger)";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="w-28 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{ width: `${v}%`, background: tone, transition: "width 400ms" }}
              />
            </div>
            <div className="w-7 text-right font-mono text-[10px] tabular-nums">{v}</div>
          </div>
        );
      })}
    </div>
  );
}
