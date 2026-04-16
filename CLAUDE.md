# Scorecard — Dashboard App

## Project Overview

A data-driven, single-page dashboard application for monitoring, scoring, and analyzing performance metrics. Built with React 19, TypeScript, Vite, Tailwind CSS v4, and Recharts.

## Tech Stack (already installed)

| Layer | Tool | Version |
|-------|------|---------|
| Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Bundler | Vite | 8 |
| Styling | Tailwind CSS v4 | 4.2 |
| UI Components | shadcn (Base UI) | 4.1 |
| Charts | Recharts | 3.8 |
| Icons | Lucide React | 1.7 |
| Data Fetching | TanStack Query | 5 |
| Utilities | clsx, tailwind-merge, cva | latest |
| Font | Geist Variable | — |

## Architecture & File Structure

```
src/
├── main.tsx                    # Entry point — renders <App /> with providers
├── App.tsx                     # Root layout — sidebar + main content area
├── index.css                   # Tailwind v4 imports + CSS custom properties for theme
├── lib/
│   ├── utils.ts                # cn() helper (clsx + twMerge), formatters
│   └── constants.ts            # App-wide constants, score thresholds, color maps
├── hooks/
│   ├── use-scorecard-data.ts   # TanStack Query hook — fetches & caches scorecard data
│   ├── use-filters.ts          # Filter state (date range, category, type)
│   └── use-theme.ts            # Dark/light mode toggle (system preference aware)
├── types/
│   └── index.ts                # All TypeScript interfaces & types (no `any`)
├── components/
│   ├── ui/                     # shadcn primitives (button, card, badge, etc.)
│   ├── layout/
│   │   ├── Sidebar.tsx         # Collapsible sidebar nav with Lucide icons
│   │   ├── Header.tsx          # Top bar — page title, theme toggle, filters
│   │   └── PageShell.tsx       # Shared page wrapper (padding, max-width, scroll)
│   ├── dashboard/
│   │   ├── ScoreOverview.tsx   # Hero section — overall score (gauge/radial)
│   │   ├── MetricCards.tsx     # Grid of KPI cards (score, trend arrow, sparkline)
│   │   ├── ScoreTrend.tsx      # Line/area chart — score over time (Recharts)
│   │   ├── CategoryBreakdown.tsx # Radar or bar chart — scores by category
│   │   ├── ActivityLog.tsx     # Scrollable table of recent entries
│   │   └── HeatmapCalendar.tsx # GitHub-style heatmap — daily score quality
│   └── shared/
│       ├── ScoreBadge.tsx      # Color-coded badge (green/yellow/red by threshold)
│       ├── TrendIndicator.tsx  # ↑ ↓ → with percentage delta
│       ├── EmptyState.tsx      # Friendly empty/loading/error states
│       └── FilterBar.tsx       # Date range picker, category multi-select
├── data/
│   └── mock.ts                 # Realistic mock data (use until API is ready)
└── providers/
    └── QueryProvider.tsx       # TanStack QueryClientProvider wrapper
```

## Coding Standards

### General Rules
- **TypeScript strict mode** — no `any`, no `@ts-ignore`, no implicit returns.
- **Functional components only** — no class components.
- **Named exports** — no default exports (except pages if routing is added later).
- **One component per file** — file name matches component name (PascalCase).
- **Co-locate** — hooks, types, and utils live near where they're used; only promote to shared dirs when reused ≥ 2 times.

### React Patterns
- Use React 19 features: `use()` for promises where appropriate, server-compatible patterns.
- State management: **React state + TanStack Query**. No Redux, no Zustand, no Context for server state.
- Prefer **composition over prop drilling** — use children, render props, or compound components.
- Memoize only when profiling proves it's needed — don't premature-optimize with `useMemo`/`useCallback` everywhere.
- Event handlers: `handleX` naming (`handleFilterChange`, `handleScoreClick`).

### Styling
- **Tailwind v4 only** — no CSS modules, no styled-components, no inline `style={}`.
- Use `cn()` utility (clsx + tailwind-merge) for conditional classes.
- Use `cva` (class-variance-authority) for component variants (size, color, state).
- Design tokens via CSS custom properties in `index.css` — colors, radii, spacing scale.
- Responsive: mobile-first (`sm:`, `md:`, `lg:` breakpoints). Dashboard should be usable on tablet.
- Dark mode: use Tailwind's `dark:` variant, toggle via class on `<html>`.

### Data & State
- **TanStack Query** for all async data — never `useEffect` + `useState` for fetching.
- Mock data in `src/data/mock.ts` — structured to match the eventual API contract.
- Query keys: `['scorecard', filters]` pattern — auto-refetch when filters change.
- Stale time: 5 minutes for dashboard data, 30 seconds for live activity log.

### Charts (Recharts)
- Wrap each chart in a `ResponsiveContainer` — never hardcode width/height.
- Use theme-aware colors (CSS variables) — charts must work in dark mode.
- Keep chart configs (colors, margins, tick formatting) in constants, not inline.
- Add meaningful tooltips and legends — no decoration-only charts.

## Scorecard Domain

### Score Categories
1. **Performance** — task completion rate, throughput, cycle time
2. **Quality** — accuracy, error rate, defect ratio
3. **Reliability** — uptime, consistency, failure recovery
4. **Engagement** — activity level, response time, participation rate
5. **Satisfaction** — ratings, feedback scores, net promoter score

### Scoring Model
- Each category: **0–100** scale
- Overall score: weighted average (Performance 25%, Quality 25%, Reliability 20%, Engagement 15%, Satisfaction 15%)
- Thresholds: **≥ 80 = Good (green)**, **60–79 = Fair (yellow)**, **< 60 = Poor (red)**

### Mock Data Shape
```typescript
interface ScorecardEntry {
  id: string;
  timestamp: string;           // ISO 8601
  entityId: string;
  entityName: string;
  ownerId: string;
  type: 'team' | 'individual' | 'department';
  scores: {
    performance: number;
    quality: number;
    reliability: number;
    engagement: number;
    satisfaction: number;
  };
  overallScore: number;
  notes?: string;
  incidents: Incident[];
}

interface Incident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  resolved: boolean;
}

interface DashboardSummary {
  currentScore: number;
  previousScore: number;
  trend: number;              // percentage change
  totalEntries: number;
  activeEntities: number;
  categoryScores: Record<string, number>;
  recentEntries: ScorecardEntry[];
  dailyScores: { date: string; score: number }[];
}
```

## Build & Run

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

## Implementation Order

When building this app, follow this sequence:

1. **Scaffold** — `vite.config.ts`, `tsconfig.json`, `index.html`, `main.tsx`, `App.tsx`, `index.css` with Tailwind v4 setup
2. **Theme & tokens** — CSS custom properties, dark mode toggle, Geist font
3. **Layout shell** — Sidebar, Header, PageShell (get the chrome right first)
4. **Types & mock data** — Define all interfaces, generate realistic mock data (30+ entries)
5. **QueryProvider + hooks** — Wire up TanStack Query with mock data adapter
6. **ScoreOverview** — The hero metric (big number + radial gauge)
7. **MetricCards** — KPI grid with sparklines
8. **ScoreTrend chart** — Time-series area chart
9. **CategoryBreakdown** — Radar chart for the 5 categories
10. **ActivityLog** — Sortable, filterable table
11. **HeatmapCalendar** — Daily quality heatmap
12. **FilterBar** — Date range + category filters wired to query keys
13. **Polish** — Animations, empty states, responsive tweaks, accessibility

## Quality Checklist

- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint warnings
- [ ] All charts responsive and dark-mode compatible
- [ ] Keyboard navigable (tab order, focus rings)
- [ ] Lighthouse accessibility score ≥ 90
- [ ] No layout shifts on data load (skeleton placeholders)
- [ ] Works on viewport widths from 768px to 2560px
