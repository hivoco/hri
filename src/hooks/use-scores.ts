import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBrands } from "./use-brands";
import type { Weights } from "@/types";

const BASE_URL = "https://node.hivoco.com";

interface ScoreEntry {
  creator: string;
  brand: string;
  platform: string;
  theme: string;
  score: number;
  views: number;
  engagement: number;
  watchtime: number;
  cpv: number;
  cost: number;
  audience: string | null;
  breakdown: {
    views: number;
    engagement: number;
    watch: number;
    cpv: number;
    cost: number;
  };
  rank: number;
}

interface ScoresResponse {
  page: number;
  limit: number;
  total: number;
  data: ScoreEntry[];
}

export function useScores(
  activeBrandFilter: string,
  weights: Weights,
  page: number,
  limit: number,
) {
  const { data: brands } = useBrands();

  const brandId =
    activeBrandFilter !== "all"
      ? brands?.find((b) => b.name === activeBrandFilter)?.id
      : undefined;

  return useQuery<ScoresResponse>({
    queryKey: ["scores", brandId ?? "all", weights.views, weights.eng, weights.watch, weights.cpv, weights.cost, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        views: String(weights.views),
        engagement: String(weights.eng),
        watchtime: String(weights.watch),
        cpv: String(weights.cpv),
        cost: String(weights.cost),
      });
      if (brandId != null) {
        params.set("brand_id", String(brandId));
      }
      const res = await fetch(`${BASE_URL}/api/dashboard/scores?${params}`);
      if (!res.ok) throw new Error("Failed to fetch scores");
      return res.json();
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export type { ScoreEntry, ScoresResponse };
