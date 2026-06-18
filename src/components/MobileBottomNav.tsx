import { Link } from "@tanstack/react-router";
import { Home, Compass, AlertTriangle, LayoutDashboard, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { to: "/", icon: Home, key: "home", testid: "tab-home" },
  { to: "/navigate", icon: Compass, key: "nav_navigate", testid: "tab-navigate" },
  { to: "/incidents", icon: AlertTriangle, key: "nav_incidents", testid: "tab-incidents" },
  { to: "/dashboard", icon: LayoutDashboard, key: "nav_dashboard", testid: "tab-dashboard" },
  { to: "/auth", icon: User, key: "sign_in", testid: "tab-auth" },
] as const;

export function MobileBottomNav() {
  const { t } = useI18n();
  return (
    <nav
      aria-label="Primary"
      data-testid="mobile-bottom-nav"
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ to, icon: Icon, key, testid }) => {
          const label = t(key as never) as string;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-label={label}
                data-testid={testid}
                id={testid}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{
                  className:
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-wider text-primary",
                }}
                activeOptions={{ exact: to === "/" }}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
