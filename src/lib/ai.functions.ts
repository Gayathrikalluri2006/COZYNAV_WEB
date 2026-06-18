// Anthropic Claude — Safety Explanation server function
import { createServerFn } from "@tanstack/react-start";
import type { SafetyFactors } from "./safety";

type Input = { factors: SafetyFactors; score: number; mode: string };
type Output = { headline: string; tip: string };

export const explainRoute = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as Input)
  .handler(async ({ data }): Promise<Output> => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return {
        headline: `Score ${data.score}/100 — AI explanation offline`,
        tip: "Configure ANTHROPIC_API_KEY in backend secrets to enable AI safety explanations.",
      };
    }
    const sys =
      'You are Aegis Route\'s safety analyst. Given route safety factors and a score (0-100, higher=safer), reply ONLY in compact JSON: {"headline": <one short sentence risk summary, max 12 words>, "tip": <one practical tip for the traveler, max 18 words>}. No markdown.';
    const user = `Mode: ${data.mode}\nScore: ${data.score}/100\nFactors (0-100, higher=worse risk): ${JSON.stringify(data.factors)}`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: sys,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return {
          headline: `Score ${data.score}/100`,
          tip: `AI service unavailable (${r.status}).` + (t ? " " + t.slice(0, 80) : ""),
        };
      }
      const j = (await r.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = j.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          if (parsed.headline && parsed.tip) {
            return { headline: String(parsed.headline), tip: String(parsed.tip) };
          }
        } catch {
          /* fall through */
        }
      }
      return {
        headline: text.split("\n")[0]?.slice(0, 100) || `Score ${data.score}/100`,
        tip: "Stay aware of your surroundings.",
      };
    } catch (e) {
      return {
        headline: `Score ${data.score}/100`,
        tip: e instanceof Error ? e.message : "Request failed.",
      };
    }
  });
