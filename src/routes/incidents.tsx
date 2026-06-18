import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { MapWrapper, type MapIncident } from "@/components/MapWrapper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, MapPin, Plus, Crosshair, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents · Aegis Route" },
      { name: "description", content: "Community-reported safety incidents around the world." },
    ],
  }),
  component: IncidentsPage,
});

const TYPES = [
  "crime",
  "accident",
  "hazard",
  "poor_lighting",
  "crowd",
  "weather",
  "other",
] as const;

function IncidentsPage() {
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<
    (MapIncident & { description: string | null; created_at: string })[]
  >([]);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({ type: "hazard", severity: 3, description: "" });
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id } : null));
    load();
    const ch = supabase
      .channel("incidents")
      .on("postgres_changes", { event: "*", schema: "public", table: "incident_reports" }, () =>
        load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function load() {
    const { data } = await supabase
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setIncidents(data as never);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPin({ lat: p.coords.latitude, lng: p.coords.longitude });
        setOpen(true);
        toast.success("Location set");
      },
      () => toast.error("Could not get your location"),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error(t("sign_in_to_report"));
      return;
    }
    if (!pin) {
      toast.error(t("invalid_coords"));
      return;
    }
    const { error } = await supabase.from("incident_reports").insert({
      user_id: user.id,
      type: form.type as never,
      severity: form.severity,
      lat: pin.lat,
      lng: pin.lng,
      description: form.description || null,
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success(t("reported"));
      setOpen(false);
      setPin(null);
      setForm({ type: "hazard", severity: 3, description: "" });
    }
  }

  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              {t("community_intel")}
            </div>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground">
              {t("incidents_title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("incidents_lead")}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={useMyLocation}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50"
            >
              <Crosshair className="h-4 w-4" /> {t("use_my_location")}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              <Plus className="h-4 w-4" /> {t("report")}
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-muted-foreground">
            <span className="font-semibold text-foreground">{t("click_map_to_report")}</span> Tap
            anywhere on the map to drop a pin, or use your current location. Then choose a type,
            severity (1–5), and submit. Reports appear instantly for everyone.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div
            className="overflow-hidden rounded-2xl border border-border bg-card"
            style={{ height: 560 }}
          >
            <MapWrapper
              incidents={incidents}
              center={[20, 0]}
              zoom={2}
              onMapClick={(lat, lng) => {
                setPin({ lat, lng });
                setOpen(true);
              }}
              pin={pin}
            />
          </div>

          <div className="space-y-3">
            {open && (
              <form
                onSubmit={submit}
                className="space-y-3 rounded-2xl border border-primary/40 bg-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-sm font-semibold text-foreground">
                    {t("new_report")}
                  </div>
                  {pin && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      📍 {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)}
                    </span>
                  )}
                </div>
                {!pin && (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    {t("click_map_to_report")}
                  </div>
                )}
                <label className="block text-xs text-muted-foreground">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
                >
                  {TYPES.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-muted-foreground">
                  {t("severity")}: {form.severity}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <textarea
                  placeholder={t("description_optional")}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground"
                  rows={2}
                />
                <button
                  disabled={!pin || !user}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {!user ? t("sign_in_to_report") : t("submit")}
                </button>
              </form>
            )}

            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {!incidents.length && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {t("no_incidents")}
                </div>
              )}
              {incidents.map((i) => (
                <div key={i.id} className="rounded-xl border border-border bg-card/60 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-[var(--risk)]" />
                      <span className="font-display text-sm font-semibold capitalize text-foreground">
                        {i.type.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("severity")} {i.severity}/5
                    </span>
                  </div>
                  {i.description && (
                    <div className="mt-1 text-sm text-muted-foreground">{i.description}</div>
                  )}
                  <div className="mt-2 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {i.lat.toFixed(3)}, {i.lng.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
