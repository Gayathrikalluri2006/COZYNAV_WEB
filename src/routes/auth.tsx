import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Aegis Route" },
      { name: "description", content: "Sign in or create an Aegis Route account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { t } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) nav({ to: "/dashboard" });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) nav({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${baseUrl}/dashboard` },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setPendingEmail(email);
          toast.success("Verification email sent — check your inbox.");
        } else {
          toast.success("Account created!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    const baseUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${baseUrl}/dashboard` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      <SiteHeader />
      <div className="mx-auto grid max-w-md px-6 py-16">
        <div className="rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-destructive">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("app_name")}
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {mode === "signin" ? t("welcome_back") : t("sign_in")}
              </h1>
            </div>
          </div>

          {pendingEmail ? (
            <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
              <Mail className="mx-auto h-8 w-8 text-primary" />
              <div className="font-display text-base font-semibold text-foreground">
                Check your email
              </div>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to{" "}
                <span className="font-mono text-foreground">{pendingEmail}</span>. Click it to
                activate your account, then sign in.
              </p>
              <button
                onClick={() => {
                  setPendingEmail(null);
                  setMode("signin");
                }}
                className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="space-y-3" data-testid="auth-form" id="auth-form">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                  data-testid="auth-email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-background p-3 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  aria-label="Password"
                  data-testid="auth-password"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-background p-3 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <button
                  disabled={loading}
                  data-testid="auth-submit"
                  id="login-button"
                  name="auth-submit"
                  className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] disabled:opacity-60"
                >
                  {loading ? "Please wait…" : mode === "signin" ? t("sign_in") : "Create account"}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                onClick={googleSignIn}
                className="w-full rounded-xl border border-border bg-background py-3 text-sm font-semibold text-foreground hover:bg-accent"
              >
                Continue with Google
              </button>

              <button
                onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
                className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                {mode === "signin" ? "No account? Create one" : "Already registered? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
