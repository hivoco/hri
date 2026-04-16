import type { Video, VideoScore, Weights } from "@/types";
import { VIEW_BENCHMARKS } from "./constants";

export function scoreVideo(v: Video, weights: Weights): VideoScore {
  const bench = VIEW_BENCHMARKS[v.platform] ?? 400000;
  const viewScore = Math.min(
    100,
    (v.views / bench) * 60 + (v.views > bench * 2 ? 40 : (v.views / bench) * 40)
  );

  const engScore = Math.min(100, (v.eng / 8) * 100);

  const watchBench = v.platform === "YouTube (long)" ? 45 : 60;
  const watchScore = Math.min(
    100,
    (v.watch / watchBench) * 80 + (v.watch > watchBench ? 20 : 0)
  );

  const cpvScore =
    v.cpv <= 0
      ? 50
      : Math.min(100, Math.max(0, 100 - ((v.cpv - 0.05) / 1.95) * 100));

  const costPerK = v.cost / (v.views / 1000);
  const costScore = Math.min(
    100,
    Math.max(0, 100 - ((costPerK - 20) / 180) * 100)
  );

  const audMult: Record<string, number> = { high: 1.15, medium: 1.0, low: 0.85 };

  const total =
    (weights.views / 100) * viewScore +
    (weights.eng / 100) * engScore +
    (weights.watch / 100) * watchScore +
    (weights.cpv / 100) * cpvScore +
    (weights.cost / 100) * costScore;

  const weighted = Math.min(100, Math.round(total * (audMult[v.audience] ?? 1.0)));

  return {
    total: weighted,
    breakdown: {
      views: Math.round(viewScore),
      eng: Math.round(engScore),
      watch: Math.round(watchScore),
      cpv: Math.round(cpvScore),
      cost: Math.round(costScore),
    },
  };
}
