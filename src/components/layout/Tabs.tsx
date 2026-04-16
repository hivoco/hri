import type { TabId } from "@/types";
import { cn } from "@/lib/utils";

const TABS: { id: TabId; label: string }[] = [
  { id: "input", label: "\u2795 Summary" },
  { id: "scores", label: "\uD83D\uDCCA Scores" },
  { id: "themes", label: "\uD83C\uDFAF Theme Analysis" },
  { id: "budget", label: "\uD83D\uDCB8 Budget Waste" },
  { id: "brands", label: "\uD83C\uDFF7 Brand View" },
];

export function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "rounded-lg border border-transparent bg-transparent px-4 py-2 font-mono text-xs tracking-wide text-muted transition-all cursor-pointer",
            tab.id === activeTab && "border-accent bg-accent text-white"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
