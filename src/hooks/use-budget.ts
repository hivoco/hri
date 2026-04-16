import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBrands } from "./use-brands";
import type { Weights } from "@/types";

const BASE_URL = "https://node.hivoco.com";

interface WasteEntry {
  creator: string;
  theme: string;
  platform: string;
  views: number;
  engagement: number;
  cost: number;
  score: number;
  verdict: string;
  rank: number;
}

interface BudgetResponse {
  page: number;
  limit: number;
  total: number;
  total_budget: number;
  budget_at_risk: number;
  percent_at_risk: number;
  waste_ranking: WasteEntry[];
}

export function useBudget(
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

  return useQuery<BudgetResponse>({
    queryKey: ["budget", brandId ?? "all", weights.views, weights.eng, weights.watch, weights.cpv, weights.cost, page, limit],
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
      const res = await fetch(`${BASE_URL}/api/dashboard/budget?${params}`);
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export type { BudgetResponse, WasteEntry };
