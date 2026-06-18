import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Aegis Route" },
      {
        name: "description",
        content: "How Aegis Route computes a real-time safety score for every route in the world.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          How it works
        </div>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight">
          The Safety Score, explained.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Aegis Route is a navigation system that ranks every road segment in the world by safety,
          not just by speed. Every route gets a 0–100 score derived from eight live signals.
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-bold">The model</h2>
          <pre className="overflow-x-auto rounded-2xl border border-border bg-card/60 p-5 font-mono text-xs leading-relaxed text-muted-foreground">{`Safety Score = 100 − Σ ( wᵢ × riskᵢ )

riskᵢ ∈ {
  crime, accidents, traffic, road_condition,
  lighting, weather, crowd_density, essentials_nearby
}

Default weights:
  crime         0.22    lighting     0.12
  accidents     0.16    weather      0.10
  traffic       0.10    crowd        0.10
  road          0.10    essentials   0.10

Personalization (additive):
  night_mode      → +lighting +crime
  avoid_isolated  → +crowd +essentials
  prefer_crowded  → +crowd`}</pre>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-bold">Roadmap</h2>
          <div className="grid gap-3">
            {[
              {
                phase: "Phase 1 · MVP",
                body: "Global routing via OpenStreetMap + OSRM, mock-weighted safety scoring, community incident reports, saved routes.",
              },
              {
                phase: "Phase 2",
                body: "Live data pipelines: crime open-data, weather APIs, traffic APIs. ML re-routing.",
              },
              {
                phase: "Phase 3",
                body: "Worldwide real-time scoring, behavioral personalization, fleet & enterprise APIs.",
              },
            ].map((p) => (
              <div key={p.phase} className="rounded-2xl border border-border bg-card/60 p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {p.phase}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{p.body}</div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
