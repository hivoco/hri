import { useState } from "react";
import type { ThemeStats, Weights } from "@/types";
import { scoreColor } from "@/lib/constants";
import { formatViews, formatCost, cn } from "@/lib/utils";
import { getThemeColor } from "@/lib/theme-colors";
import { EmptyState } from "../shared/EmptyState";
import { useThemes } from "@/hooks/use-themes";
import { Target, Loader } from "lucide-react";

const PAGE_SIZE = 9;

export function ThemesPanel({
  themeStats,
  activeBrandFilter,
  weights,
}: {
  themeStats: ThemeStats[];
  activeBrandFilter: string;
  weights: Weights;
}) {
  const [page, setPage] = useState(1);
  const { data: response, isLoading, isError } = useThemes(activeBrandFilter, weights, page, PAGE_SIZE);

  const apiThemes = response?.data;
  const totalPages = response ? Math.ceil(response.total / response.limit) : 0;

  // API data available
  if (apiThemes && apiThemes.length > 0) {
    const maxScore = Math.max(...apiThemes.map((t) => t.avg_score));

    return (
      <div>
        <div className="mb-5 rounded-lg border border-accent2/20 bg-accent2/5 px-4 py-2.5 text-xs text-muted2">
          <strong>Theme Intelligence:</strong> Scores weighted by your current
          settings. Adjust weights in
          {"\u201C"}Add Videos{"\u201D"} tab to remodel.
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apiThemes.map((t) => {
            const [tc] = getThemeColor(t.theme);
            const col = scoreColor(t.avg_score);

            return (
              <div
                key={t.theme}
                className="rounded-xl border border-border bg-card p-5"
                style={{ borderTop: `3px solid ${tc}` }}
              >
                <div className="mb-1 font-gilroy-bold text-[15px] font-bold">
                  {t.theme}
                </div>
                <div className="mb-4 text-[11px] text-muted">
                  {t.video_count} video{t.video_count > 1 ? "s" : ""} {"\u00B7"}{" "}
                  {t.label}
                </div>
                <ThemeMetric label="Total Views" value={formatViews(t.total_views)} />
                <ThemeMetric label="Avg Engagement" value={`${t.avg_engagement}%`} />
                <ThemeMetric label="Total Spend" value={formatCost(t.total_spend)} />
                <ThemeMetric label="Avg CPV" value={`\u20B9${t.avg_cpv}`} />
                <ThemeMetric label="Verdict" value={t.verdict} />
                <div className="mt-3 font-gilroy-bold text-[40px] font-extrabold leading-none" style={{ color: col }}>
                  {t.avg_score}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  avg score / 100
                </div>
                <div className="mt-2 h-1 rounded-sm bg-border">
                  <div
                    className="h-1 rounded-sm transition-[width] duration-500"
                    style={{ width: `${(t.avg_score / maxScore) * 100}%`, background: col }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <EmptyState
        icon={<Loader className="size-10 animate-spin" />}
        title="Loading themes..."
        sub="Fetching data from server."
      />
    );
  }

  // API failed — fall back to local data
  if (isError || !apiThemes) {
    return <LocalThemesPanel themeStats={themeStats} activeBrandFilter={activeBrandFilter} />;
  }

  // API returned empty
  return (
    <EmptyState
      icon={<Target className="size-10" />}
      title={activeBrandFilter !== "all" ? `No themes for ${activeBrandFilter}` : "No theme data yet"}
      sub="No theme scores available."
    />
  );
}

/* ---- Local fallback ---- */

function LocalThemesPanel({
  themeStats,
  activeBrandFilter,
}: {
  themeStats: ThemeStats[];
  activeBrandFilter: string;
}) {
  if (!themeStats.length) {
    return (
      <EmptyState
        icon={<Target className="size-10" />}
        title={activeBrandFilter !== "all" ? `No videos for ${activeBrandFilter}` : "No theme data yet"}
        sub="Add videos with different content themes."
      />
    );
  }

  const maxScore = Math.max(...themeStats.map((t) => t.avgScore));

  return (
    <div>
      <div className="mb-5 rounded-lg border border-accent2/20 bg-accent2/5 px-4 py-2.5 text-xs text-muted2">
        <strong>Theme Intelligence:</strong> Scores weighted by your current
        settings. High-intent audience videos get a 15% boost. Adjust weights in
        {"\u201C"}Add Videos{"\u201D"} tab to remodel.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themeStats.map((t, i) => {
          const [tc] = getThemeColor(t.name);
          const col = scoreColor(t.avgScore);
          const verdict =
            t.avgScore >= 75
              ? "\uD83D\uDE80 Double down"
              : t.avgScore >= 55
                ? "\u26A1 Optimize & scale"
                : t.avgScore >= 35
                  ? "\u26A0\uFE0F Needs work"
                  : "\uD83D\uDED1 Rethink strategy";

          return (
            <div
              key={t.name}
              className="rounded-xl border border-border bg-card p-5"
              style={{ borderTop: `3px solid ${tc}` }}
            >
              <div className="mb-1 font-gilroy-bold text-[15px] font-bold">
                {t.name}
              </div>
              <div className="mb-4 text-[11px] text-muted">
                {t.vids.length} video{t.vids.length > 1 ? "s" : ""} {"\u00B7"}{" "}
                {i === 0
                  ? "\uD83C\uDFC6 Best theme"
                  : i === themeStats.length - 1
                    ? "\u26A0\uFE0F Weakest"
                    : `#${i + 1} ranked`}
              </div>
              <ThemeMetric label="Total Views" value={formatViews(t.totalViews)} />
              <ThemeMetric label="Avg Engagement" value={`${t.avgEng}%`} />
              <ThemeMetric label="Total Spend" value={formatCost(t.totalCost)} />
              <ThemeMetric label="Avg CPV" value={`\u20B9${t.avgCPV}`} />
              <ThemeMetric label="Verdict" value={verdict} />
              <div className="mt-3 font-gilroy-bold text-[40px] font-extrabold leading-none" style={{ color: col }}>
                {t.avgScore}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                avg score / 100
              </div>
              <div className="mt-2 h-1 rounded-sm bg-border">
                <div
                  className="h-1 rounded-sm transition-[width] duration-500"
                  style={{ width: `${(t.avgScore / maxScore) * 100}%`, background: col }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between text-xs">
      <span className="text-muted2">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/* ---- Pagination ---- */

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const btnCls = "rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-[11px] font-semibold cursor-pointer transition-all hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        className={btnCls}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {getPageNumbers(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted">{"\u2026"}</span>
        ) : (
          <button
            key={p}
            className={cn(btnCls, p === page && "border-accent bg-accent text-white hover:bg-accent")}
            onClick={() => onPageChange(p as number)}
          >
            {p}
          </button>
        )
      )}
      <button
        className={btnCls}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}