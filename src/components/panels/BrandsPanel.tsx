import { useState } from "react";
import type { Weights } from "@/types";
import { scoreColor, BRAND_COLORS } from "@/lib/constants";
import { formatViews, formatCost } from "@/lib/utils";
import { useBrandView } from "@/hooks/use-brand-view";
import type { BrandViewEntry } from "@/hooks/use-brand-view";

export function BrandsPanel({
  weights,
  onDrillBrand,
}: {
  weights: Weights;
  onDrillBrand: (brand: string) => void;
}) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data: response, isLoading, isError } = useBrandView(weights, page, limit);

  const brands = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        Loading brand data…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-danger">
        Failed to load brand data. Please try again.
      </div>
    );
  }

  if (!brands.length) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        No brand data available.
      </div>
    );
  }

  const maxScore = Math.max(...brands.map((b) => b.avg_score));

  return (
    <div>
      <div className="mb-5 rounded-lg border border-accent2/20 bg-accent2/5 px-4 py-2.5 text-xs text-muted2">
        <strong>Brand Intelligence:</strong> Each card shows the aggregated
        performance scorecard per brand. Click a brand chip in the filter bar to
        deep-dive into that brand{"\u2019"}s videos across all tabs.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const col = scoreColor(b.avg_score);
          const [bc, bbg] = BRAND_COLORS[b.brand] ?? ["#64748b", "#f8f8f8"];

          return (
            <BrandCard
              key={b.brand}
              b={b}
              col={col}
              bc={bc}
              bbg={bbg}
              maxScore={maxScore}
              onDrillBrand={onDrillBrand}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function BrandCard({
  b,
  col,
  bc,
  bbg,
  maxScore,
  onDrillBrand,
}: {
  b: BrandViewEntry;
  col: string;
  bc: string;
  bbg: string;
  maxScore: number;
  onDrillBrand: (brand: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const verdictColor = (verdict: string) => {
    switch (verdict) {
      case "Double down":
        return "var(--color-success)";
      case "Optimize":
        return "var(--color-accent3)";
      case "Needs work":
        return "#f97316";
      default:
        return "var(--color-danger)";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="flex items-center justify-between border-b border-border px-5 py-4"
        style={{ background: bbg }}
      >
        <div>
          <div className="font-gilroy-bold text-sm font-bold capitalize" style={{ color: bc }}>
            {b.brand}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            {b.video_count} video{b.video_count !== 1 ? "s" : ""} {"\u00B7"} {b.label}
          </div>
        </div>
        <div className="text-right">
          <div className="font-gilroy-bold text-[32px] font-extrabold leading-none" style={{ color: col }}>
            {b.avg_score}
          </div>
          <div className="text-[10px] text-muted">/100</div>
        </div>
      </div>

      <div className="px-5 py-4">
        <BrandMetric label="Total Views" value={formatViews(b.total_views)} />
        <BrandMetric label="Avg Engagement" value={`${b.avg_engagement}%`} />
        <BrandMetric label="Total Spend" value={formatCost(b.total_spend)} />
        <BrandMetric label="Avg CPV" value={`\u20B9${b.avg_cpv}`} />
        <BrandMetric label="Top Creator" value={b.top_creator} valueStyle={{ fontSize: 11 }} />
        <BrandMetric
          label="At-Risk Videos"
          value={b.at_risk_videos > 0 ? `${b.at_risk_videos} \u26A0\uFE0F` : "0 \u2705"}
          valueStyle={{ color: b.at_risk_videos > 0 ? "var(--color-danger)" : "var(--color-success)" }}
        />
        <BrandMetric
          label="Verdict"
          value={b.verdict}
          valueStyle={{ color: verdictColor(b.verdict), fontWeight: 600 }}
          noBorder
        />

        <div className="mt-3 h-1 rounded-sm bg-border">
          <div
            className="h-1 rounded-sm transition-[width] duration-500"
            style={{ width: `${(b.avg_score / maxScore) * 100}%`, background: col }}
          />
        </div>

        <button
          onClick={() => onDrillBrand(b.brand)}
          className="mt-3 w-full cursor-pointer rounded-lg border p-1.5 font-gilroy-bold text-[11px] font-bold transition-all"
          style={{
            borderColor: `${bc}44`,
            background: hovered ? bc : bbg,
            color: hovered ? "white" : bc,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          View {b.brand} Videos {"\u2192"}
        </button>
      </div>
    </div>
  );
}

function BrandMetric({
  label,
  value,
  valueStyle,
  noBorder,
}: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  noBorder?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 text-xs ${noBorder ? "" : "border-b border-border"}`}
    >
      <span className="text-muted2">{label}</span>
      <span className="font-semibold text-text" style={valueStyle}>{value}</span>
    </div>
  );
}
