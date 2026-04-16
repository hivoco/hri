import { useState } from "react";
import type { ScoredVideo, Weights } from "@/types";
import { scoreColor, getPlatformIcon } from "@/lib/constants";
import { formatViews, formatCost, cn } from "@/lib/utils";
import { EmptyState } from "../shared/EmptyState";
import { useBudget } from "@/hooks/use-budget";

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

const PAGE_SIZE = 10;

export function BudgetPanel({
  scoredVideos,
  activeBrandFilter,
  weights,
}: {
  scoredVideos: ScoredVideo[];
  activeBrandFilter: string;
  weights: Weights;
}) {
  const [page, setPage] = useState(1);
  const { data: apiBudget, isLoading, isError } = useBudget(activeBrandFilter, weights, page, PAGE_SIZE);

  // Loading
  if (isLoading) {
    return (
      <EmptyState
        icon="\u23F3"
        title="Loading budget data..."
        sub="Fetching data from server."
      />
    );
  }

  // API failed — fall back to local data
  if (isError || !apiBudget) {
    return <LocalBudgetPanel scoredVideos={scoredVideos} activeBrandFilter={activeBrandFilter} />;
  }

  // API returned empty
  if (apiBudget.waste_ranking.length === 0) {
    return (
      <EmptyState
        icon="\uD83D\uDCB8"
        title={activeBrandFilter !== "all" ? `No budget data for ${activeBrandFilter}` : "No budget data yet"}
        sub="No budget data available."
      />
    );
  }

  // API data available
  const totalPages = Math.ceil(apiBudget.total / apiBudget.limit);

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Budget" value={formatCost(apiBudget.total_budget)} />
        <SummaryCard
          label="Budget at Risk"
          value={formatCost(apiBudget.budget_at_risk)}
          valueColor="var(--color-danger)"
          sub="score below 50"
        />
        <SummaryCard
          label="% at Risk"
          value={`${apiBudget.percent_at_risk}%`}
          valueColor="var(--color-accent3)"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-danger" />
            <div className="font-gilroy-bold text-base font-bold">
              Budget Waste Ranking (worst first)
            </div>
          </div>
          <span className="text-xs text-muted2">
            {apiBudget.total} videos · Page {apiBudget.page} of {totalPages}
          </span>
        </div>
        {apiBudget.waste_ranking.map((v) => {
          const col = scoreColor(v.score);

          return (
            <div
              key={`${v.rank}-${v.creator}`}
              className="flex items-center gap-4 border-b border-border py-3.5"
            >
              <div className="w-8 font-gilroy-bold text-[22px] font-extrabold text-muted">
                {v.rank}
              </div>
              <div className="mr-3">
                <div
                  className="inline-flex h-6 w-11 items-center justify-center rounded-md font-gilroy-bold text-[13px] font-extrabold"
                  style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}
                >
                  {v.score}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 text-sm font-medium">{v.creator}</div>
                <div className="text-[11px] text-muted">
                  {v.theme} {"\u00B7"} {getPlatformIcon(v.platform)} {v.platform} {"\u00B7"} {formatViews(v.views)} views {"\u00B7"} {v.engagement}% eng
                </div>
              </div>
              <div className="text-right">
                <div className="font-gilroy-bold text-base font-bold">{formatCost(v.cost)}</div>
                <div
                  className="mt-0.5 text-[10px] uppercase tracking-wide"
                  style={{ color: getVerdictColor(v.verdict) }}
                >
                  {v.verdict}
                </div>
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

/* ---- Helpers ---- */

function SummaryCard({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-4 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r before:from-accent before:to-accent2">
      <div className="mb-2 text-[10px] uppercase tracking-[1.5px] text-muted">{label}</div>
      <div className="font-gilroy-bold text-xl font-extrabold" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted2">{sub}</div>}
    </div>
  );
}

function getVerdictColor(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v.includes("great")) return "var(--color-success)";
  if (v.includes("acceptable")) return "var(--color-accent3)";
  if (v.includes("underperforming")) return "#f97316";
  return "var(--color-danger)";
}

/* ---- Local fallback ---- */

function LocalBudgetPanel({
  scoredVideos,
  activeBrandFilter,
}: {
  scoredVideos: ScoredVideo[];
  activeBrandFilter: string;
}) {
  if (!scoredVideos.length) {
    return (
      <EmptyState
        icon="\uD83D\uDCB8"
        title={activeBrandFilter !== "all" ? `No videos for ${activeBrandFilter}` : "No budget data yet"}
        sub="Add creator cost data first."
      />
    );
  }

  const sorted = [...scoredVideos].sort((a, b) => {
    const wasteA = (a.cost / 1000) * (100 - a.score.total);
    const wasteB = (b.cost / 1000) * (100 - b.score.total);
    return wasteB - wasteA;
  });

  const totalBudget = scoredVideos.reduce((a, v) => a + v.cost, 0);
  const atRisk = sorted
    .filter((v) => v.score.total < 50)
    .reduce((a, v) => a + v.cost, 0);
  const pctAtRisk = totalBudget ? Math.round((atRisk / totalBudget) * 100) : 0;

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Budget" value={formatCost(totalBudget)} />
        <SummaryCard
          label="Budget at Risk"
          value={formatCost(atRisk)}
          valueColor="var(--color-danger)"
          sub="score below 50"
        />
        <SummaryCard
          label="% at Risk"
          value={`${pctAtRisk}%`}
          valueColor="var(--color-accent3)"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-danger" />
          <div className="font-gilroy-bold text-base font-bold">
            Budget Waste Ranking (worst first)
          </div>
        </div>
        {sorted.map((v, i) => {
          const col = scoreColor(v.score.total);
          const verdict =
            v.score.total >= 75
              ? { t: "\u2705 Great ROI", c: "var(--color-success)" }
              : v.score.total >= 55
                ? { t: "\uD83D\uDFE1 Acceptable", c: "var(--color-accent3)" }
                : v.score.total >= 35
                  ? { t: "\u26A0\uFE0F Underperforming", c: "#f97316" }
                  : { t: "\uD83D\uDED1 Budget Wasted", c: "var(--color-danger)" };

          return (
            <div
              key={v.id}
              className="flex items-center gap-4 border-b border-border py-3.5"
            >
              <div className="w-8 font-gilroy-bold text-[22px] font-extrabold text-muted">
                {i + 1}
              </div>
              <div className="mr-3">
                <div
                  className="inline-flex h-6 w-11 items-center justify-center rounded-md font-gilroy-bold text-[13px] font-extrabold"
                  style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}
                >
                  {v.score.total}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 text-sm font-medium">{v.creator}</div>
                <div className="text-[11px] text-muted">
                  {v.theme} {"\u00B7"} {getPlatformIcon(v.platform)} {v.platform} {"\u00B7"} {formatViews(v.views)} views {"\u00B7"} {v.eng}% eng
                </div>
              </div>
              <div className="text-right">
                <div className="font-gilroy-bold text-base font-bold">{formatCost(v.cost)}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide" style={{ color: verdict.c }}>{verdict.t}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
