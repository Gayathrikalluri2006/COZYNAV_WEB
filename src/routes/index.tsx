import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SafetyBadge } from "@/components/SafetyBadge";
import { Shield, Activity, Brain, Globe2, Zap, Eye, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aegis Route — Smart Safety Navigation" },
      {
        name: "description",
        content:
          "The world's first safety-first navigation. Real-time safety scores for every route, globally.",
      },
      { property: "og:title", content: "Aegis Route — Smart Safety Navigation" },
      {
        property: "og:description",
        content:
          "Navigation that prioritizes safety over speed. Live safety scores for every route.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "var(--gradient-radial)" }}
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:py-32">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3 py-1 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[var(--safe)] pulse-glow" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Live · Global Coverage
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Navigate by{" "}
              <span className="bg-gradient-to-br from-primary via-[var(--caution)] to-destructive bg-clip-text text-transparent">
                safety
              </span>
              ,<br /> not just speed.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Aegis Route scores every road in the world from 0–100 using crime, accidents,
              lighting, weather and crowd data — then routes you the safest way home.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/navigate"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03]"
              >
                Open Live Map
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3.5 font-medium text-foreground backdrop-blur transition-colors hover:bg-card"
              >
                How it works
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {[
                { v: "8", l: "Risk signals" },
                { v: "5min", l: "Refresh rate" },
                { v: "🌍", l: "Worldwide" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-2xl font-bold text-foreground">{s.v}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HUD preview */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-[var(--shadow-card)] backdrop-blur scanline">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Route preview
                  </div>
                  <div className="font-display text-lg font-semibold">Mumbai → Pune</div>
                </div>
                <div className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  03:42 · Night
                </div>
              </div>

              <div className="my-6 grid place-items-center">
                <SafetyBadge score={78} size="lg" />
              </div>

              <div className="space-y-2">
                {[
                  { label: "Crime risk", value: 28, tone: "var(--safe)" },
                  { label: "Accident frequency", value: 41, tone: "var(--caution)" },
                  { label: "Lighting", value: 22, tone: "var(--safe)" },
                  { label: "Weather", value: 15, tone: "var(--safe)" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className="w-32 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${m.value}%`, background: m.tone }}
                      />
                    </div>
                    <div className="w-8 text-right font-mono text-xs tabular-nums text-foreground">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-primary/20 via-transparent to-destructive/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border/60 bg-background/40">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-14 max-w-2xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Intelligence layer
            </div>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">
              Every road, scored. Every minute, refreshed.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Dynamic Safety Score",
                desc: "Weighted aggregation of 8 real-world risk signals, recalculated every 5 minutes.",
              },
              {
                icon: Activity,
                title: "Live Heatmap",
                desc: "See risk zones overlaid on the map — crime, accidents, weather, lighting.",
              },
              {
                icon: Brain,
                title: "AI Re-routing",
                desc: "Predicts unsafe zones and suggests safer alternatives before you arrive.",
              },
              {
                icon: Globe2,
                title: "Truly Global",
                desc: "Powered by OpenStreetMap & OSRM. Works in every country, no setup.",
              },
              {
                icon: Zap,
                title: "Smart Alerts",
                desc: "Push notifications when your route enters a high-risk area.",
              },
              {
                icon: Eye,
                title: "Personalized",
                desc: "Night-mode safety, avoid isolated roads, prefer crowded zones — your call.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition-all hover:border-primary/40 hover:bg-card"
              >
                <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-destructive/10 ring-1 ring-primary/20">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="font-display text-lg font-semibold">{f.title}</div>
                <div className="mt-1.5 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Aegis Route · Safety-first navigation</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]">v0.1 · MVP</div>
        </div>
      </footer>
    </div>
  );
}
