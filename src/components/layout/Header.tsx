import { Moon, Sun } from "lucide-react";

export function Header({
  isDark,
  onToggleTheme,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  return (
    <header className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-accent font-gilroy-bold text-[13px] font-extrabold text-white">
            HRI
          </div>
          <div>
            <div className="font-gilroy-bold text-xl font-extrabold tracking-tight">
              HRI Scorecard
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[2px] text-muted">
              Influencer Video Scoring Engine
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-transparent text-text transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="rounded-full border border-accent/25 bg-linear-to-br from-accent/10 to-accent2/10 px-3.5 py-1.5 text-[11px] uppercase tracking-wide text-accent2">
            {"\u26A1"} Score 0{"\u2013"}100
          </div>
        </div>
      </div>
    </header>
  );
}
