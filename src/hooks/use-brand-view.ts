import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { Weights } from "@/types";

const BASE_URL = "https://node.hivoco.com";

interface BrandViewEntry {
  brand: string;
  video_count: number;
  avg_score: number;
  total_views: number;
  avg_engagement: number;
  total_spend: number;
  avg_cpv: number;
  top_creator: string;
  at_risk_videos: number;
  rank: number;
  verdict: string;
  label: string;
}

interface BrandViewResponse {
  page: number;
  limit: number;
  total: number;
  data: BrandViewEntry[];
}

export function useBrandView(
  weights: Weights,
  page: number,
  limit: number,
) {
  return useQuery<BrandViewResponse>({
    queryKey: ["brand-view", weights.views, weights.eng, weights.watch, weights.cpv, weights.cost, page, limit],
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
      const res = await fetch(`${BASE_URL}/api/dashboard/brand-view?${params}`);
      if (!res.ok) throw new Error("Failed to fetch brand view");
      return res.json();
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export type { BrandViewEntry, BrandViewResponse };
