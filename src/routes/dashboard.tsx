import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { SafetyBadge } from "@/components/SafetyBadge";
import { toast } from "sonner";
import { Trash2, LogOut, Map } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Aegis Route" },
      { name: "description", content: "Your saved routes and safety preferences." },
    ],
  }),
  component: Dashboard,
});

type SavedRoute = {
  id: string;
  label: string;
  origin_text: string;
  destination_text: string;
  last_safety_score: number | null;
  created_at: string;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning ☀️";
  if (h < 18) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}

function Dashboard() {
  const nav = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    night_mode_safety: boolean;
    avoid_isolated: boolean;
    prefer_crowded: boolean;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        nav({ to: "/auth" });
        return;
      }
      setUser({ id: data.user.id, email: data.user.email });
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase.from("saved_routes").select("*").order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("display_name,night_mode_safety,avoid_isolated,prefer_crowded")
          .eq("id", data.user.id)
          .maybeSingle(),
      ]);
      if (r) setRoutes(r as never);
      if (p) setProfile(p as never);
    });
  }, [nav]);

  async function deleteRoute(id: string) {
    const { error } = await supabase.from("saved_routes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setRoutes((rs) => rs.filter((r) => r.id !== id));
  }

  async function updatePref(
    key: "night_mode_safety" | "avoid_isolated" | "prefer_crowded",
    v: boolean,
  ) {
    if (!profile || !user) return;
    setProfile({ ...profile, [key]: v });
    const update: Record<string, boolean> = { [key]: v };
    await supabase
      .from("profiles")
      .update(update as never)
      .eq("id", user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  if (!user) return null;

  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              {greeting()}
            </div>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">
              {profile?.display_name || user.email}
            </h1>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm hover:border-destructive/50 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-display text-lg font-semibold">Saved routes</h2>
            {!routes.length && (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
                <Map className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No saved routes yet.</p>
                <Link
                  to="/navigate"
                  className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Plan your first route
                </Link>
              </div>
            )}
            {routes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-4"
              >
                <div className="flex items-center gap-4">
                  {r.last_safety_score != null && (
                    <SafetyBadge score={r.last_safety_score} size="sm" />
                  )}
                  <div>
                    <div className="font-display font-semibold">{r.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteRoute(r.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Safety preferences</h2>
            <div className="space-y-2 rounded-2xl border border-border bg-card/60 p-4">
              {(
                [
                  ["night_mode_safety", "Night-mode safety"],
                  ["avoid_isolated", "Avoid isolated roads"],
                  ["prefer_crowded", "Prefer crowded zones"],
                ] as const
              ).map(([k, label]) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-accent/40"
                >
                  <span className="text-sm">{label}</span>
                  <input
                    type="checkbox"
                    checked={!!profile?.[k]}
                    onChange={(e) => updatePref(k, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
