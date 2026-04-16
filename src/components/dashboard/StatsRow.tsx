import { scoreColor } from "@/lib/constants";
import { formatCost } from "@/lib/utils";

interface StatsRowProps {
  videoCount: number;
  avgScore: number | null;
  bestTheme: string | null;
  topCreator: string | null;
  budgetAtRisk: number | null;
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
  valueFontSize,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
  valueFontSize?: string;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-4 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-linear-to-r before:from-accent before:to-accent2">
      <div className="mb-2 text-[10px] uppercase tracking-[1.5px] text-muted">
        {label}
      </div>
      <div
        className="font-gilroy-bold font-extrabold leading-none"
        style={{ fontSize: valueFontSize ?? "28px", color: valueColor }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[11px] text-muted2">{sub}</div>
    </div>
  );
}

export function StatsRow({
  videoCount,
  avgScore,
  bestTheme,
  topCreator,
  budgetAtRisk,
}: StatsRowProps) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 ">
      <StatCard
        label="Videos Tracked"
        value={String(videoCount)}
        sub="across all creators"
      />
      <StatCard
        label="Avg Score"
        value={avgScore != null ? String(avgScore) : "\u2014"}
        sub="out of 100"
        valueColor={avgScore != null ? scoreColor(avgScore) : undefined}
      />
      <StatCard
        label="Best Theme"
        value={bestTheme ?? "\u2014"}
        sub="highest avg score"
        valueFontSize="16px"
      />
      <StatCard
        label="Budget at Risk"
        value={
          budgetAtRisk != null
            ? budgetAtRisk > 0
              ? formatCost(budgetAtRisk)
              : "\u20B90"
            : "\u2014"
        }
        sub="low-score, high-cost"
        valueFontSize="20px"
        valueColor="var(--color-danger)"
      />
      <StatCard
        label="Top Creator"
        value={topCreator ?? "\u2014"}
        sub="highest score"
        valueFontSize="15px"
      />
    </div>
  );
}
