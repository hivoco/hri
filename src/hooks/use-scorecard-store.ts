import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
  Video,
  Weights,
  CampaignMeta,
  TabId,
  ScoredVideo,
  ThemeStats,
  BrandStats,
} from "@/types";
import { DEFAULT_WEIGHTS } from "@/lib/constants";
import { scoreVideo } from "@/lib/scoring";
import { onWeightRollback } from "@/lib/weight-rollback";

const SAMPLE_DATA: Video[] = [
  { id: 1, creator: "@priya_glam", brand: "Streax Colour", theme: "Hair Color Tutorial", platform: "Instagram Reels", views: 5000000, eng: 5.2, watch: 72, cost: 80000, cpv: 0.016, audience: "high" },
  { id: 2, creator: "@rohan_fit", brand: "Streax Colour", theme: "Hair Color Tutorial", platform: "Instagram Reels", views: 1500000, eng: 3.1, watch: 45, cost: 120000, cpv: 0.08, audience: "medium" },
  { id: 3, creator: "@sneha_home", brand: "Streax Gel", theme: "Home Makeover", platform: "YouTube (long)", views: 800000, eng: 7.4, watch: 68, cost: 60000, cpv: 0.075, audience: "high" },
  { id: 4, creator: "@amit_vlogs", brand: "Streax Serum", theme: "Product Unboxing", platform: "YouTube Shorts", views: 2200000, eng: 2.8, watch: 40, cost: 50000, cpv: 0.023, audience: "low" },
  { id: 5, creator: "@kavya_beauty", brand: "Streax Skin", theme: "Hair Color Tutorial", platform: "TikTok", views: 3800000, eng: 8.1, watch: 80, cost: 45000, cpv: 0.012, audience: "medium" },
  { id: 6, creator: "@nikhil_tech", brand: "Streax Vitagrowth", theme: "Product Unboxing", platform: "YouTube (long)", views: 450000, eng: 4.5, watch: 55, cost: 90000, cpv: 0.2, audience: "medium" },
  { id: 7, creator: "@divya_lifestyle", brand: "Streax Rosemary", theme: "Home Makeover", platform: "Instagram Reels", views: 920000, eng: 6.2, watch: 61, cost: 70000, cpv: 0.076, audience: "high" },
  { id: 8, creator: "@raj_comedy", brand: "Vasmol SHC", theme: "Brand Integration", platform: "Instagram Reels", views: 4100000, eng: 9.3, watch: 35, cost: 200000, cpv: 0.049, audience: "low" },
];

export function useScorecardStore() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [weights, setWeights] = useState<Weights>({ ...DEFAULT_WEIGHTS });
  const [weightError, setWeightError] = useState(false);
  const previousWeights = useRef<Weights>({ ...DEFAULT_WEIGHTS });
  const [activeTab, setActiveTab] = useState<TabId>("input");
  const [activeBrandFilter, setActiveBrandFilter] = useState("all");
  const [campaignMeta, setCampaignMeta] = useState<CampaignMeta | null>(null);

  const addVideo = useCallback((video: Omit<Video, "id">) => {
    setVideos((prev) => [...prev, { ...video, id: Date.now() + Math.random() }]);
  }, []);

  const removeVideo = useCallback((id: number) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const importVideos = useCallback((newVideos: Omit<Video, "id">[]) => {
    setVideos((prev) => [
      ...prev,
      ...newVideos.map((v) => ({ ...v, id: Date.now() + Math.random() })),
    ]);
  }, []);

  const loadSampleData = useCallback(() => {
    setVideos(SAMPLE_DATA);
  }, []);

  const updateWeight = useCallback((key: keyof Weights, value: number) => {
    setWeights((prev) => {
      previousWeights.current = { ...prev };
      return { ...prev, [key]: value };
    });
  }, []);

  const resetWeights = useCallback(() => {
    previousWeights.current = { ...DEFAULT_WEIGHTS };
    setWeights({ ...DEFAULT_WEIGHTS });
  }, []);

  const rollbackWeights = useCallback(() => {
    setWeights({ ...previousWeights.current });
    setWeightError(true);
  }, []);

  const dismissWeightError = useCallback(() => {
    setWeightError(false);
  }, []);

  // Subscribe to global rollback events from QueryCache onError
  useEffect(() => {
    return onWeightRollback(rollbackWeights);
  }, [rollbackWeights]);

  const totalWeight = weights.views + weights.eng + weights.watch + weights.cpv + weights.cost;

  const filteredVideos = useMemo(() => {
    if (activeBrandFilter === "all") return videos;
    return videos.filter((v) => v.brand === activeBrandFilter);
  }, [videos, activeBrandFilter]);

  const scoredVideos: ScoredVideo[] = useMemo(
    () =>
      filteredVideos.map((v) => ({
        ...v,
        score: scoreVideo(v, weights),
      })),
    [filteredVideos, weights]
  );

  const allScoredVideos: ScoredVideo[] = useMemo(
    () => videos.map((v) => ({ ...v, score: scoreVideo(v, weights) })),
    [videos, weights]
  );

  const stats = useMemo(() => {
    const fv = filteredVideos;
    const scored = scoredVideos;
    const n = fv.length;

    if (!n) {
      return {
        videoCount: 0,
        avgScore: null as number | null,
        bestTheme: null as string | null,
        topCreator: null as string | null,
        budgetAtRisk: null as number | null,
      };
    }

    const avgScore = Math.round(
      scored.reduce((a, v) => a + v.score.total, 0) / n
    );

    const best = [...scored].sort((a, b) => b.score.total - a.score.total)[0];

    const themeMap: Record<string, number[]> = {};
    scored.forEach((v) => {
      if (!themeMap[v.theme]) themeMap[v.theme] = [];
      themeMap[v.theme]!.push(v.score.total);
    });
    const bestThemeEntry = Object.entries(themeMap).sort((a, b) => {
      const avgA = a[1].reduce((s, v) => s + v, 0) / a[1].length;
      const avgB = b[1].reduce((s, v) => s + v, 0) / b[1].length;
      return avgB - avgA;
    })[0];

    const atRisk = fv
      .filter((v) => scoreVideo(v, weights).total < 50)
      .reduce((a, v) => a + v.cost, 0);

    return {
      videoCount: n,
      avgScore,
      bestTheme: bestThemeEntry ? bestThemeEntry[0] : null,
      topCreator: best ? best.creator : null,
      budgetAtRisk: atRisk,
    };
  }, [filteredVideos, scoredVideos, weights]);

  const themeStats: ThemeStats[] = useMemo(() => {
    const themeMap: Record<string, ScoredVideo[]> = {};
    scoredVideos.forEach((v) => {
      if (!themeMap[v.theme]) themeMap[v.theme] = [];
      themeMap[v.theme]!.push(v);
    });

    return Object.entries(themeMap)
      .map(([name, vids]) => ({
        name,
        vids,
        avgScore: Math.round(vids.reduce((a, v) => a + v.score.total, 0) / vids.length),
        totalViews: vids.reduce((a, v) => a + v.views, 0),
        avgEng: (vids.reduce((a, v) => a + v.eng, 0) / vids.length).toFixed(1),
        totalCost: vids.reduce((a, v) => a + v.cost, 0),
        avgCPV: (vids.reduce((a, v) => a + v.cpv, 0) / vids.length).toFixed(2),
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [scoredVideos]);

  const brandStats: BrandStats[] = useMemo(() => {
    const brandMap: Record<string, ScoredVideo[]> = {};
    allScoredVideos.forEach((v) => {
      const b = v.brand || "Unassigned";
      if (!brandMap[b]) brandMap[b] = [];
      brandMap[b]!.push(v);
    });

    return Object.entries(brandMap)
      .map(([name, vids]) => {
        const sorted = [...vids].sort((a, b) => b.score.total - a.score.total);
        return {
          name,
          vids,
          avgScore: Math.round(vids.reduce((a, v) => a + v.score.total, 0) / vids.length),
          totalViews: vids.reduce((a, v) => a + v.views, 0),
          avgEng: (vids.reduce((a, v) => a + v.eng, 0) / vids.length).toFixed(1),
          totalCost: vids.reduce((a, v) => a + v.cost, 0),
          avgCPV: (vids.reduce((a, v) => a + v.cpv, 0) / vids.length).toFixed(2),
          topCreator: sorted[0]!,
          atRisk: vids.filter((v) => v.score.total < 50).length,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [allScoredVideos]);

  const drillBrand = useCallback((brandName: string) => {
    setActiveBrandFilter(brandName);
    setActiveTab("scores");
  }, []);

  return {
    videos,
    weights,
    activeTab,
    activeBrandFilter,
    campaignMeta,
    filteredVideos,
    scoredVideos,
    allScoredVideos,
    stats,
    themeStats,
    brandStats,
    totalWeight,
    addVideo,
    removeVideo,
    importVideos,
    loadSampleData,
    updateWeight,
    resetWeights,
    rollbackWeights,
    weightError,
    dismissWeightError,
    setActiveTab,
    setActiveBrandFilter,
    setCampaignMeta,
    drillBrand,
  };
}
