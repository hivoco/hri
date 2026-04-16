# Senior React Code Review — HRI Scorecard Dashboard

A production-readiness review of the HRI Scorecard React dashboard codebase, written from the perspective of a senior React engineer (10+ years) who has shipped and maintained data-intensive dashboards at scale.

---

## Critical Bugs — Things That Produce Wrong Data or Crash the UI

### 1. Division by Zero in Cost Scoring → NaN Propagation
**Severity:** critical
**Where:** `src/lib/scoring.ts:24`
**What:** When `v.views === 0`, the calculation `costPerK = v.cost / (v.views / 1000)` produces `Infinity` or `NaN`. This taints the entire `total` score via the weighted sum, and `NaN` renders silently in the UI.
**Why it matters:** One video with zero views makes the entire scorecard show `NaN` for that entry. Users see broken data with no error message.
**Fix:**
```typescript
const costPerK = v.views > 0 ? v.cost / (v.views / 1000) : 0;
```

---

### 2. No NaN Guard at Scoring Output
**Severity:** critical
**Where:** `src/lib/scoring.ts:39-40`
**What:** If any intermediate calculation is `NaN`, the returned `weighted` score is `NaN`. No validation at the return boundary. Components downstream receive `NaN` scores and render them.
**Fix:**
```typescript
const weighted = Math.min(100, Math.round(total * (audMult[v.audience] ?? 1.0)));
if (isNaN(weighted) || !isFinite(weighted)) {
  return { total: 0, breakdown: { views: 0, eng: 0, watch: 0, cpv: 0, cost: 0 } };
}
return { total: weighted, breakdown: { ... } };
```

---

### 3. Math.max on Empty Array → -Infinity Division
**Severity:** critical
**Where:** `src/components/panels/ThemesPanel.tsx:29`, `src/components/panels/BrandsPanel.tsx:47`
**What:** `Math.max(...apiThemes.map(t => t.avg_score))` returns `-Infinity` when the array is empty. This is then used as a divisor for progress bar widths: `width: ${(t.avg_score / maxScore) * 100}%`. Division by `-Infinity` produces `0%` or `NaN%`.
**Fix:**
```typescript
const maxScore = apiThemes.length > 0 ? Math.max(...apiThemes.map(t => t.avg_score)) : 1;
```

---

### 4. Invalid CSS Width Unit on Score Progress Bars
**Severity:** critical
**Where:** `src/components/panels/ScoresPanel.tsx:136, 321`
**What:** `style={{ width: v.score * 0.8, background: col }}` passes a number without a CSS unit to `width`. React interprets unitless numbers as pixels for some properties but `width` requires explicit units.
**Fix:**
```typescript
style={{ width: `${Math.min(v.score * 0.8, 100)}%`, background: col }}
```

---

### 5. Broken CSS Custom Property
**Severity:** critical
**Where:** `src/index.css:18`
**What:** `--font-bonito:"bontio","fallback",` — incomplete declaration (trailing comma, no semicolon), typo ("bontio"), and never used anywhere. Breaks CSS parsing for subsequent properties.
**Fix:** Delete the line entirely.

---

### 6. Hardcoded API URL in 6 Files
**Severity:** critical
**Where:** `src/hooks/use-scores.ts:5`, `use-budget.ts:5`, `use-summary.ts:5`, `use-themes.ts:5`, `use-brand-view.ts:4`, `use-brands.ts:3`
**What:** `const BASE_URL = "https://node.hivoco.com"` is hardcoded in every hook file. No environment variable support. Switching environments requires code changes and redeployment.
**Fix:** Create a shared API config:
```typescript
// src/lib/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://node.hivoco.com";
```
Then import from all hooks.

---

### 7. No API Response Validation
**Severity:** critical
**Where:** All hooks in `src/hooks/use-*.ts`
**What:** After `res.json()`, there is zero validation that the response matches the declared TypeScript interface. A malformed response (missing fields, wrong types) silently succeeds and gets cast to the generic type. One missing field from the backend and the whole page blows up.
**Fix:** Add runtime validation at the boundary (zod, or simple shape guards).

---

## Architectural Debt — Fine Now, Hurts at 2x Scale

### 8. God Store Re-render Bomb
**Severity:** warning
**Where:** `src/hooks/use-scorecard-store.ts` (entire file)
**What:** One massive hook holds videos, weights, filters, UI state (activeTab), computed values (scoredVideos, stats, themeStats, brandStats), and all mutation callbacks. Every component that calls `useScorecardStore()` re-renders when ANY piece of state changes — typing in a filter re-renders every chart.
**Fix:** Split into focused hooks: `useWeights()`, `useVideos()`, `useFilters()`. Or use context selectors to subscribe to slices.

---

### 9. Dual Source of Truth for Stats
**Severity:** warning
**Where:** `src/App.tsx:18-26`
**What:** Stats are computed from two sources with fallback logic: `apiSummary?.videos_tracked ?? store.stats.videoCount`. When API is slow or stale, the UI displays data from one source while charts show another. No indicator tells the user which source is active.
**Fix:** Pick one authoritative source. If API is primary, show loading/error states. Don't silently mix.

---

### 10. Pagination Logic Duplicated 3 Times
**Severity:** warning
**Where:** `src/components/panels/ScoresPanel.tsx:177-233`, `BudgetPanel.tsx:10-64`, `ThemesPanel.tsx:204-258`
**What:** Three nearly identical `Pagination` components and `getPageNumbers()` functions with 95%+ duplicate code.
**Fix:** Extract to `src/components/shared/PaginationControls.tsx`.

---

### 11. Unbounded Query Key Cache Bloat
**Severity:** warning
**Where:** `src/hooks/use-scores.ts:50` (and all weight-dependent hooks)
**What:** Every individual weight value is a separate entry in the queryKey. With sliders allowing 0-50 values across 5 weights, dragging creates hundreds of unique cache entries that never get garbage collected.
**Fix:** Serialize weights into a single stable key: `JSON.stringify(weights)` or a hash.

---

### 12. No Error Boundary
**Severity:** warning
**Where:** `src/App.tsx` (entire application)
**What:** No error boundary component anywhere. If any child component throws (bad data point in a chart, undefined property access), the entire dashboard white-screens.
**Fix:** Add `<ErrorBoundary>` around each panel at minimum.

---

### 13. No Weight Validation Before API Calls
**Severity:** warning
**Where:** `src/hooks/use-scorecard-store.ts:54`
**What:** `updateWeight` accepts any number. Negative values, values over 100, or weights that don't sum to 100 all flow directly into API queries as query params.
**Fix:**
```typescript
const updateWeight = useCallback((key: keyof Weights, value: number) => {
  if (value < 0 || value > 50) return;
  setWeights((prev) => {
    previousWeights.current = { ...prev };
    return { ...prev, [key]: value };
  });
}, []);
```

---

### 14. Single Listener Overwrite in Weight Rollback
**Severity:** warning
**Where:** `src/lib/weight-rollback.ts:6`
**What:** `onWeightRollback` overwrites the previous listener. If multiple hook instances subscribe, only the last one fires.
**Fix:** Use a `Set<Listener>` instead of a single variable.

---

### 15. No Input Sanitization on Excel Upload
**Severity:** warning
**Where:** `src/components/panels/ExcelUpload.tsx:55-77`
**What:** User-provided CSV/Excel data is directly mapped to component state and rendered in tables without sanitization. React escapes by default, but if any `dangerouslySetInnerHTML` is added later, this is an XSS vector.
**Fix:** Validate and sanitize string fields at the import boundary.

---

### 16. Missing Memoization on Expensive Row Components
**Severity:** warning
**Where:** `ScoresPanel.tsx`, `BudgetPanel.tsx`, `ThemesPanel.tsx`, `BrandsPanel.tsx`
**What:** Row/card components like `ApiScoreRow`, `ThemeMetric`, `BrandCard` re-render on every parent state change. With 50+ items per page, this causes visible jank.
**Fix:** Wrap with `React.memo()`.

---

### 17. Dark Mode Color Contrast Issues
**Severity:** warning
**Where:** Multiple components with dynamic inline `style={{ background, color }}`
**What:** Hardcoded colors (e.g., `#64748b`, `#f1f5f9` brand defaults) don't adapt to dark mode. Score badges with `${col}22` opacity backgrounds have poor contrast on dark backgrounds. WCAG AA requires 4.5:1 ratio.
**Fix:** Use theme-aware color mappings or CSS variables for badge backgrounds.

---

### 18. Touch Targets Below 44px
**Severity:** warning
**Where:** Pagination buttons, filter buttons across panels
**What:** Buttons with `px-3 py-1.5` are ~36px tall, below the 44x44px mobile accessibility standard.
**Fix:** Add responsive padding: `py-1.5 md:py-2.5`.

---

### 19. Missing ARIA Labels on Icon-Only Buttons
**Severity:** warning
**Where:** `src/components/layout/Header.tsx:27-33`
**What:** Theme toggle button has `title` but no `aria-label`. `title` is unreliable for screen readers.
**Fix:** Add `aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}`.

---

## Quick Wins — Small Changes, Big Impact

### 20. 5 Unused Dependencies (~2-3MB)
**Severity:** warning
**Where:** `package.json`
**What:** `@base-ui/react`, `recharts`, `shadcn`, `tw-animate-css`, `@fontsource-variable/geist` are installed but never imported in source code.
**Fix:** `npm uninstall @base-ui/react recharts shadcn tw-animate-css @fontsource-variable/geist`

---

### 21. Unused Google Font Loading
**Severity:** nit
**Where:** `index.html:7`
**What:** Syne font family loaded from Google Fonts but never used in CSS. Extra HTTP request on every page load.
**Fix:** Remove the `<link>` or trim to only DM Mono if used.

---

### 22. Generic API Error Messages
**Severity:** nit
**Where:** All hooks in `src/hooks/use-*.ts`
**What:** `throw new Error("Failed to fetch scores")` — no status code, no response body. Debugging production issues requires guessing.
**Fix:** `throw new Error(\`Failed to fetch scores: ${res.status} ${res.statusText}\`)`.

---

### 23. Comment Pollution
**Severity:** nit
**Where:** `src/components/panels/ScoresPanel.tsx:132`
**What:** `{/* remove this later on */}` — temporary comment shipped in production code.
**Fix:** Remove it.

---

### 24. Silent Audience Multiplier Fallback
**Severity:** nit
**Where:** `src/lib/scoring.ts:39`
**What:** Unrecognized `v.audience` values silently default to `1.0x` multiplier. Typos or API changes produce wrong scores with no warning.
**Fix:** Log a warning for unknown audience values.

---

## What's Solid — Patterns to Keep

1. **TanStack Query usage is correct** — query keys include all filter dimensions, `keepPreviousData` prevents UI flashing during refetches, `staleTime` is set appropriately.
2. **Optimistic slider updates** — `WeightSlider` local state + debounced propagation is the right pattern for range inputs driving API calls. Rollback on failure is wired up.
3. **Component file organization** — one component per file, PascalCase naming, co-located by feature (panels/, dashboard/, shared/).
4. **Tailwind + `cn()` utility** — consistent use of `clsx + twMerge` for conditional classes. No inline `style={}` except where dynamic values require it.
5. **TypeScript strictness** — no `any` types found. Interfaces are well-defined. The type system is pulling its weight.

---

## Summary

| Severity | Count | Examples |
|----------|-------|---------|
| Critical | 7 | NaN propagation, broken CSS, hardcoded URLs, no response validation |
| Warning | 12 | God store, dual source of truth, no error boundary, cache bloat, a11y |
| Nit | 5 | Unused deps, generic errors, comment pollution |

**Top 5 priority fixes:**
1. Guard division-by-zero in `scoring.ts` — wrong data is worse than no data
2. Fix CSS width unit bug in `ScoresPanel.tsx` — progress bars don't render
3. Delete broken CSS property in `index.css` — breaks subsequent declarations
4. Move hardcoded API URL to env variable — blocking for staging/prod deploys
5. Add error boundary — one bad data point shouldn't white-screen the dashboard
