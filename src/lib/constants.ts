export const BRANDS = [
  "Streax Colour",
  "Streax Gel",
  "Streax Serum",
  "Streax Skin",
  "Streax Vitagrowth",
  "Streax Rosemary",
  "Streax Pro Serum",
  "Vasmol SHC",
] as const;

export type BrandName = (typeof BRANDS)[number];

export const BRAND_COLORS: Record<string, [string, string]> = {
  "Streax Colour": ["#e11d48", "#fce7f3"],
  "Streax Gel": ["#7c3aed", "#ede9fe"],
  "Streax Serum": ["#0891b2", "#e0f2fe"],
  "Streax Skin": ["#d97706", "#fef3c7"],
  "Streax Vitagrowth": ["#059669", "#d1fae5"],
  "Streax Rosemary": ["#be185d", "#fce7f3"],
  "Streax Pro Serum": ["#4f46e5", "#e0e7ff"],
  "Vasmol SHC": ["#b45309", "#fef3c7"],
};

export const THEME_COLORS: [string, string][] = [
  ["#7c3aed", "#7c3aed33"],
  ["#06b6d4", "#06b6d433"],
  ["#f59e0b", "#f59e0b33"],
  ["#10b981", "#10b98133"],
  ["#ef4444", "#ef444433"],
  ["#8b5cf6", "#8b5cf633"],
  ["#ec4899", "#ec489933"],
  ["#14b8a6", "#14b8a633"],
  ["#f97316", "#f9731633"],
];

export const PLATFORM_OPTIONS = [
  "Instagram Reels",
  "YouTube Shorts",
  "YouTube (long)",
  "TikTok",
] as const;

export type Platform = (typeof PLATFORM_OPTIONS)[number];

export const PLATFORM_ICONS: Record<string, string> = {
  "Instagram Reels": "\uD83D\uDCF8",
  "YouTube Shorts": "\u25B6\uFE0F",
  "YouTube (long)": "\uD83C\uDFAC",
  TikTok: "\uD83C\uDFB5",
};

export const AUDIENCE_OPTIONS = [
  { value: "high", label: "25\u201340 (High intent)" },
  { value: "medium", label: "20\u201330 (Mid intent)" },
  { value: "low", label: "13\u201322 (Browse/Discovery)" },
] as const;

export const AUDIENCE_LABELS: Record<string, string> = {
  high: "25-40 \uD83C\uDFAF",
  medium: "20-30 \u26A1",
  low: "13-22 \uD83D\uDC40",
};

export const VIEW_BENCHMARKS: Record<string, number> = {
  "Instagram Reels": 500000,
  "YouTube Shorts": 300000,
  "YouTube (long)": 100000,
  TikTok: 800000,
};

export const DEFAULT_WEIGHTS = {
  views: 20,
  eng: 25,
  watch: 25,
  cpv: 20,
  cost: 10,
};

export function scoreColor(score: number): string {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

export function getPlatformIcon(platform: string): string {
  return PLATFORM_ICONS[platform] ?? "\uD83D\uDCF1";
}
