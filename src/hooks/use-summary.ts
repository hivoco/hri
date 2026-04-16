import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBrands } from "./use-brands";
import type { Weights } from "@/types";

const BASE_URL = "https://node.hivoco.com";

interface SummaryResponse {
  videos_tracked: number;
  avg_score: number;
  best_theme: string;
  budget_at_risk: number;
  top_creator: string;
}

export function useSummary(activeBrandFilter: string, weights: Weights) {
  const { data: brands } = useBrands();

  const brandId =
    activeBrandFilter !== "all"
      ? brands?.find((b) => b.name === activeBrandFilter)?.id
      : undefined;

  return useQuery<SummaryResponse>({
    queryKey: ["summary", brandId ?? "all", weights.views, weights.eng, weights.watch, weights.cpv, weights.cost],
    queryFn: async () => {
      const params = new URLSearchParams({
        views: String(weights.views),
        engagement: String(weights.eng),
        watchtime: String(weights.watch),
        cpv: String(weights.cpv),
        cost: String(weights.cost),
      });
      if (brandId != null) {
        params.set("brand_id", String(brandId));
      }
      const res = await fetch(`${BASE_URL}/api/dashboard/summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
