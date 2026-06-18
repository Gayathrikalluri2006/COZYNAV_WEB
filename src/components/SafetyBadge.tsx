import { scoreLabel } from "@/lib/safety";

export function SafetyBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const { label, tone } = scoreLabel(score);
  const toneColor =
    tone === "safe"
      ? "var(--safe)"
      : tone === "caution"
        ? "var(--caution)"
        : tone === "risk"
          ? "var(--risk)"
          : "var(--danger)";

  const dim = size === "lg" ? 132 : size === "md" ? 88 : 56;
  const stroke = size === "lg" ? 10 : size === "md" ? 7 : 5;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            stroke="oklch(0.22 0.018 250)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            stroke={toneColor}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 600ms ease, stroke 400ms ease",
              filter: `drop-shadow(0 0 8px ${toneColor})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center leading-none">
            <div
              className="font-display font-bold tabular-nums"
              style={{ fontSize: dim * 0.32, color: toneColor }}
            >
              {score}
            </div>
            {size === "lg" && (
              <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                / 100
              </div>
            )}
          </div>
        </div>
      </div>
      {size !== "sm" && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Safety Score
          </div>
          <div className="font-display text-lg font-semibold" style={{ color: toneColor }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
