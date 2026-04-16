import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useBrands } from "./use-brands";
import type { Weights } from "@/types";

const BASE_URL = "https://node.hivoco.com";

interface ThemeEntry {
  theme: string;
  video_count: number;
  avg_score: number;
  total_views: number;
  avg_engagement: number;
  total_spend: number;
  avg_cpv: number;
  rank: number;
  verdict: string;
  label: string;
}

interface ThemesResponse {
  page: number;
  limit: number;
  total: number;
  data: ThemeEntry[];
}

export function useThemes(
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

  return useQuery<ThemesResponse>({
    queryKey: ["themes", brandId ?? "all", weights.views, weights.eng, weights.watch, weights.cpv, weights.cost, page, limit],
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
      const res = await fetch(`${BASE_URL}/api/dashboard/themes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export type { ThemeEntry, ThemesResponse };
