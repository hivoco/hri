import { useState } from "react";
import type { ScoredVideo, Weights } from "@/types";
import { scoreColor, getPlatformIcon, BRAND_COLORS, AUDIENCE_LABELS } from "@/lib/constants";
import { formatViews, formatCPV, formatCost, cn } from "@/lib/utils";
import { getThemeColor } from "@/lib/theme-colors";
import { EmptyState } from "../shared/EmptyState";
import { useScores, type ScoreEntry } from "@/hooks/use-scores";

const PAGE_SIZE = 10;

export function ScoresPanel({
  scoredVideos,
  activeBrandFilter,
  weights,
}: {
  scoredVideos: ScoredVideo[];
  activeBrandFilter: string;
  weights: Weights;
}) {
  const [page, setPage] = useState(1);
  const { data: apiData, isLoading, isError } = useScores(activeBrandFilter, weights, page, PAGE_SIZE);

  // Reset to page 1 when brand filter changes
  const handleBrandAwarePage = (newPage: number) => setPage(newPage);

  // Loading state
  if (isLoading) {
    return (
      <EmptyState
        icon="\u23F3"
        title="Loading scores..."
        sub="Fetching data from server."
      />
    );
  }

  // API failed or empty — fall back to local data
  if (isError || !apiData) {
    return <LocalScoresTable scoredVideos={scoredVideos} activeBrandFilter={activeBrandFilter} />;
  }

  // API returned empty data
  if (apiData.data.length === 0) {
    return (
      <EmptyState
        icon="\uD83D\uDCCA"
        title={activeBrandFilter !== "all" ? `No videos for ${activeBrandFilter}` : "No videos scored yet"}
        sub="No scores available."
      />
    );
  }

  // API data available — use it
  const totalPages = Math.ceil(apiData.total / apiData.limit);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted2">
        <span>{apiData.total} videos scored</span>
        <span>Page {apiData.page} of {totalPages}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-surface">
              {["#", "Creator", "Brand", "Platform", "Theme", "Score", "Views", "Eng %", "Watch %", "CPV \u20B9", "Cost \u20B9", "Audience", "Breakdown"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apiData.data.map((v) => (
              <ApiScoreRow key={`${v.rank}-${v.creator}`} entry={v} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={handleBrandAwarePage} />
    </div>
  );
}

/* ---- API score row ---- */

function ApiScoreRow({ entry: v }: { entry: ScoreEntry }) {
  const col = scoreColor(v.score);
  const [tc, tcbg] = getThemeColor(v.theme);
  const [bc, bbg] = BRAND_COLORS[v.brand] ?? ["#64748b", "#f1f5f9"];
  const rankColors = getRankColors(v.rank);

  return (
    <tr className="border-b border-border transition-colors hover:bg-surface">
      <td className="px-3 py-2">
        <div
          className="inline-flex h-6 w-6 items-center justify-center rounded-md font-gilroy-bold text-xs font-bold"
          style={rankColors}
        >
          {v.rank}
        </div>
      </td>
      <td className="px-3 py-2 font-medium">{v.creator}</td>
      <td className="px-3 py-2">
        <span
          className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style={{ background: bbg, color: bc, border: `1px solid ${bc}33` }}
        >
          {v.brand || "\u2014"}
        </span>
      </td>
      <td className="px-3 py-2">
        {getPlatformIcon(v.platform)} {v.platform}
      </td>
      <td className="px-3 py-2">
        <span
          className="rounded px-2.5 py-0.5 text-[10px] tracking-wide"
          style={{ color: tc, border: `1px solid ${tc}44`, background: tcbg }}
        >
          {v.theme}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2.5">
          <div
            className="inline-flex h-7 w-13 items-center justify-center rounded-md font-gilroy-bold text-sm font-extrabold"
            style={{
              background: `${col}22`,
              color: col,
              border: `1px solid ${col}44`,
            }}
          >
            {Math.min(v.score,100)}
            {/* remove this later on  */}
          </div>
          <div
            className="h-1.5 min-w-1 rounded-sm transition-[width] duration-500"
            style={{ width: v.score * 0.8, background: col }}
          />
        </div>
      </td>
      <td className="px-3 py-2">{formatViews(v.views)}</td>
      <td className="px-3 py-2">{v.engagement}%</td>
      <td className="px-3 py-2">{v.watchtime}%</td>
      <td className="px-3 py-2">{formatCPV(v.cpv)}</td>
      <td className="px-3 py-2">{formatCost(v.cost)}</td>
      <td className="px-3 py-2 text-[11px]">
        {v.audience ? (AUDIENCE_LABELS[v.audience] ?? v.audience) : "\u2014"}
      </td>
      <td className="px-3 py-2">
        <div className="flex gap-1">
          {(
            [
              ["V", v.breakdown.views],
              ["E", v.breakdown.engagement],
              ["W", v.breakdown.watch],
              ["C", v.breakdown.cpv],
              ["\u20B9", v.breakdown.cost],
            ] as const
          ).map(([label, sc]) => (
            <div key={label} className="text-center">
              <div className="mb-0.5 text-[9px] text-muted">{label}</div>
              <div
                className="text-[11px] font-semibold"
                style={{ color: scoreColor(sc) }}
              >
                {sc}
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
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
            className={cn(
              btnCls,
              p === page && "border-accent bg-accent text-white hover:bg-accent",
            )}
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

/* ---- Rank colors helper ---- */

function getRankColors(rank: number) {
  if (rank === 1) return { background: "#f59e0b33", color: "var(--color-accent3)", border: "1px solid #f59e0b44" };
  if (rank === 2) return { background: "#94a3b833", color: "#94a3b8", border: "1px solid #94a3b844" };
  if (rank === 3) return { background: "#cd7c3233", color: "#cd7c32", border: "1px solid #cd7c3244" };
  return { background: "var(--color-border)", color: "var(--color-muted)" };
}

/* ---- Local fallback table (original) ---- */

function LocalScoresTable({
  scoredVideos,
  activeBrandFilter,
}: {
  scoredVideos: ScoredVideo[];
  activeBrandFilter: string;
}) {
  if (!scoredVideos.length) {
    return (
      <EmptyState
        icon="\uD83D\uDCCA"
        title={activeBrandFilter !== "all" ? `No videos for ${activeBrandFilter}` : "No videos scored yet"}
        sub="Add creator videos first."
      />
    );
  }

  const sorted = [...scoredVideos].sort((a, b) => b.score.total - a.score.total);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            {["#", "Creator", "Brand", "Platform", "Theme", "Score", "Views", "Eng %", "Watch %", "CPV \u20B9", "Cost \u20B9", "Audience", "Breakdown"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((v, i) => {
            const col = scoreColor(v.score.total);
            const [tc, tcbg] = getThemeColor(v.theme);
            const [bc, bbg] = BRAND_COLORS[v.brand] ?? ["#64748b", "#f1f5f9"];
            const rankColors = getRankColors(i + 1);

            return (
              <tr key={v.id} className="border-b border-border transition-colors hover:bg-surface">
                <td className="px-3 py-2">
                  <div
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md font-gilroy-bold text-xs font-bold"
                    style={rankColors}
                  >
                    {i + 1}
                  </div>
                </td>
                <td className="px-3 py-2 font-medium">{v.creator}</td>
                <td className="px-3 py-2">
                  <span
                    className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: bbg, color: bc, border: `1px solid ${bc}33` }}
                  >
                    {v.brand || "\u2014"}
                  </span>
                </td>
                <td className="px-3 py-2">{getPlatformIcon(v.platform)} {v.platform}</td>
                <td className="px-3 py-2">
                  <span
                    className="rounded px-2.5 py-0.5 text-[10px] tracking-wide"
                    style={{ color: tc, border: `1px solid ${tc}44`, background: tcbg }}
                  >
                    {v.theme}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="inline-flex h-7 w-13 items-center justify-center rounded-md font-gilroy-bold text-sm font-extrabold"
                      style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}
                    >
                      {v.score.total}
                    </div>
                    <div
                      className="h-1.5 min-w-1 rounded-sm transition-[width] duration-500"
                      style={{ width: v.score.total * 0.8, background: col }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">{formatViews(v.views)}</td>
                <td className="px-3 py-2">{v.eng}%</td>
                <td className="px-3 py-2">{v.watch}%</td>
                <td className="px-3 py-2">{formatCPV(v.cpv)}</td>
                <td className="px-3 py-2">{formatCost(v.cost)}</td>
                <td className="px-3 py-2 text-[11px]">{AUDIENCE_LABELS[v.audience] ?? v.audience}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {(
                      [
                        ["V", v.score.breakdown.views],
                        ["E", v.score.breakdown.eng],
                        ["W", v.score.breakdown.watch],
                        ["C", v.score.breakdown.cpv],
                        ["\u20B9", v.score.breakdown.cost],
                      ] as const
                    ).map(([label, sc]) => (
                      <div key={label} className="text-center">
                        <div className="mb-0.5 text-[9px] text-muted">{label}</div>
                        <div className="text-[11px] font-semibold" style={{ color: scoreColor(sc) }}>{sc}</div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
