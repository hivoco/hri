export type AudienceType = "high" | "medium" | "low";

export interface Video {
  id: number;
  creator: string;
  theme: string;
  brand: string;
  platform: string;
  views: number;
  eng: number;
  watch: number;
  cost: number;
  cpv: number;
  audience: AudienceType;
}

export interface ScoreBreakdown {
  views: number;
  eng: number;
  watch: number;
  cpv: number;
  cost: number;
}

export interface VideoScore {
  total: number;
  breakdown: ScoreBreakdown;
}

export interface ScoredVideo extends Video {
  score: VideoScore;
}

export interface Weights {
  views: number;
  eng: number;
  watch: number;
  cpv: number;
  cost: number;
}

export interface CampaignMeta {
  name: string;
  brand: string;
  period: string;
}

export type TabId = "input" | "scores" | "themes" | "budget" | "brands";

export interface ThemeStats {
  name: string;
  vids: ScoredVideo[];
  avgScore: number;
  totalViews: number;
  avgEng: string;
  totalCost: number;
  avgCPV: string;
}

export interface BrandStats {
  name: string;
  vids: ScoredVideo[];
  avgScore: number;
  totalViews: number;
  avgEng: string;
  totalCost: number;
  avgCPV: string;
  topCreator: ScoredVideo;
  atRisk: number;
}
