import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Weights } from "@/types";
import { DEFAULT_WEIGHTS } from "@/lib/constants";
import { SectionCard } from "./InputPanel";

function WeightSlider({
  label,
  value,
  onUpdate,
}: {
  label: string;
  value: number;
  onUpdate: (value: number) => void;
}) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onUpdate(next), 500);
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-wide text-muted2">{label}</span>
        <span className="font-gilroy-bold text-sm font-bold text-accent2">
          {local}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={50}
        value={local}
        onChange={handleChange}
        className="mt-2"
      />
    </div>
  );
}

const WEIGHT_ITEMS: { key: keyof Weights; label: string }[] = [
  { key: "views", label: "Views (Reach)" },
  { key: "eng", label: "Engagement Rate" },
  { key: "watch", label: "Watch Time %" },
  { key: "cpv", label: "CPV Efficiency" },
  { key: "cost", label: "Cost per Creator" },
];

export function WeightControls({
  weights,
  totalWeight,
  onUpdateWeight,
  onResetWeights,
}: {
  weights: Weights;
  totalWeight: number;
  onUpdateWeight: (key: keyof Weights, value: number) => void;
  onResetWeights: () => void;
}) {
  return (
    <SectionCard
      dotColor="var(--color-accent2)"
      title="Scoring Weights"
      extra={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetWeights}
            disabled={WEIGHT_ITEMS.every(({ key }) => weights[key] === DEFAULT_WEIGHTS[key])}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted2 transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <div className="text-xs" style={{ color: totalWeight === 100 ? "var(--color-muted)" : "var(--color-danger)" }}>
            Total: <span className="font-semibold text-accent3">{totalWeight}</span>%
          </div>
        </div>
      }
    >
      <div className="mb-4 rounded-lg border border-accent2/20 bg-accent2/5 px-4 py-2.5 text-xs text-muted2 ">
        <strong>Context-aware scoring:</strong> Adjust weights to match your
        campaign goals. High-value audiences deserve more CPV weight. Watch time
        matters more for awareness. Engagement signals intent.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WEIGHT_ITEMS.map(({ key, label }) => (
          <WeightSlider
            key={key}
            label={label}
            value={weights[key]}
            onUpdate={(v) => onUpdateWeight(key, v)}
          />
        ))}
      </div>
    </SectionCard>
  );
}
