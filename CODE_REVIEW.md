# Senior Code Review — HRI Scorecard Dashboard

---

## 1. Critical Bugs

### Division by Zero in Scoring
**Severity:** critical
**Where:** `src/lib/scoring.ts:24`
**What:** `const costPerK = v.cost / (v.views / 1000)` — when `v.views` is 0, this produces `Infinity`, which propagates into `costScore` as `NaN`, then into the final `total` as `NaN`. The UI will render "NaN" in the score badge.
**Why it matters:** A video with 0 views is a legitimate data state (just uploaded, metrics pending). The entire scoring pipeline collapses.
**Fix:**
```typescript
const costPerK = v.views > 0 ? v.cost / (v.views / 1000) : Infinity;
const costScore = v.views <= 0
  ? 0
  : Math.min(100, Math.max(0, 100 - ((costPerK - 20) / 180) * 100));
```

### Weights Don't Normalize — Garbage Scores When Total != 100
**Severity:** critical
**Where:** `src/lib/scoring.ts:32-37`
**What:** The formula divides each weight by 100 (`weights.views / 100`), not by the *sum of weights*. If the user drags sliders to total 60%, the max possible score is 60, not 100. At 140%, scores exceed 100 before the final `Math.min` clamp, which hides the distortion but still produces misleading relative rankings.
**Why it matters:** The UI shows the total and turns it red when != 100 (`src/components/panels/WeightControls.tsx:56`), but nothing prevents the user from navigating away. All scores on the Scores/Themes/Budget tabs become meaningless.
**Fix:** Normalize in `scoreVideo`:
```typescript
const sum = weights.views + weights.eng + weights.watch + weights.cpv + weights.cost;
const norm = sum > 0 ? sum : 1;
const total =
  (weights.views / norm) * viewScore +
  (weights.eng / norm) * engScore +
  // ...
```

### Stale Page State on Brand Filter Change
**Severity:** critical
**Where:** `src/components/panels/ScoresPanel.tsx:20-24`
**What:** When the brand filter changes, `page` stays at whatever it was. If the user is on page 5 of "All Brands" and then filters to a brand with 3 total videos, the API returns empty for page 5. The loading/empty/error fallback flow kicks in, confusing the user.
**Why it matters:** The `handleBrandAwarePage` function is defined but never resets page on filter change — it's just a `setPage` alias.
**Fix:** Add a `useEffect` to reset page when `activeBrandFilter` changes:
```typescript
useEffect(() => setPage(1), [activeBrandFilter]);
```

### Dual Source of Truth — API vs Local Data
**Severity:** critical
**Where:** `src/App.tsx:19-25`
**What:** `stats` uses `apiSummary ?? store.stats` with nullish coalescing. If the API returns `avg_score: 0`, that's used. But if the API returns `undefined` for a field, it silently falls through to local `store.stats` which computes from a completely different dataset (local `videos[]`). The stats row can show API video count next to a locally-computed "best theme."
**Why it matters:** The user sees numbers from two different data sources in the same stats row with no indication they're mixed.
**Fix:** Pick one source. If API data is available, use it entirely. If not, fall back entirely to local. Don't mix.

---

## 2. Data Layer Issues

### No API Response Validation
**Severity:** warning
**Where:** All hooks in `src/hooks/` — `use-scores.ts`, `use-summary.ts`, `use-themes.ts`, `use-budget.ts`
**What:** Every `queryFn` does `return res.json()` with no validation. If the API returns `{ data: null }` instead of `{ data: [] }`, or adds/removes a field, the app crashes at render time with an unhelpful error.
**Fix:** Validate at the boundary. At minimum, add runtime checks for required fields. Ideally use Zod.

### Hardcoded API Base URL
**Severity:** warning
**Where:** `src/hooks/use-scores.ts:6`, `use-summary.ts:4`, `use-themes.ts:5`, `use-budget.ts:5`, `use-brands.ts:3`
**What:** `const BASE_URL = "https://node.hivoco.com"` is hardcoded in 5 files. This breaks staging/local development and is duplicated across every hook.
**Fix:** Move to a single `import.meta.env.VITE_API_BASE_URL` constant in one file (e.g., `lib/constants.ts`).

### `formatCPV` Doesn't Format
**Severity:** warning
**Where:** `src/lib/utils.ts:30-32`
**What:** `formatCPV` just prepends the rupee sign: `"₹" + cpv`. A CPV of `0.0125` renders as `₹0.0125`. No rounding, no fixed decimal places. Compare with how `avgCPV` in the store is `.toFixed(2)` — inconsistent formatting across the app.
**Fix:** `return "₹" + cpv.toFixed(3);` or use the same precision everywhere.

---

## 3. State Architecture

### God Hook — `useScorecardStore`
**Severity:** warning
**Where:** `src/hooks/use-scorecard-store.ts`
**What:** This 200-line hook holds videos, weights, filters, campaign meta, active tab, AND computes scoredVideos, stats, themeStats, brandStats. Every weight slider drag recomputes everything via `useMemo`. Every tab switch causes `App` and all children to re-render because `store` is a single object spread across every prop.
**Why it matters:** At 500+ videos, `scoredVideos`, `allScoredVideos`, `stats`, `themeStats`, and `brandStats` all recompute on every weight change. That's 5 O(n) passes synchronously on the main thread.
**Fix:** Split into smaller hooks: `useWeights()`, `useVideos()`, `useActiveTab()`. Or at minimum, don't pass the entire store object — pass individual stable values.

### Double Scoring in `stats` Computation
**Severity:** warning
**Where:** `src/hooks/use-scorecard-store.ts:112-114`
**What:** `stats` already has `scoredVideos` in scope (precomputed), but then calls `scoreVideo(v, weights)` again inline to calculate `atRisk`. This re-scores every video a second time.
**Fix:** Use `scoredVideos` which already has scores:
```typescript
const atRisk = scoredVideos
  .filter((v) => v.score.total < 50)
  .reduce((a, v) => a + v.cost, 0);
```

### Theme Color Assignment Is Global Mutable State
**Severity:** warning
**Where:** `src/lib/theme-colors.ts`
**What:** `themeColorMap` and `themeColorIdx` are module-level mutable variables. The color a theme gets depends on the *order* themes are first encountered. If the user loads brands tab first (different theme order) vs. scores tab first, the same theme gets different colors. In React 18+ with concurrent features, render order is not guaranteed.
**Fix:** Derive color deterministically from the theme name (e.g., hash the string).

### `useDebouncedCallback` Has Stale Closure Risk
**Severity:** warning
**Where:** `src/components/panels/WeightControls.tsx:7-19`
**What:** The debounced callback captures `fn` in its dependency array, but `fn` is `onUpdateWeight` which is a `useCallback` with `[]` deps — so it's stable. However, this custom debounce hook has a subtle issue: the range input's `onChange` calls the debounced version, but the displayed value (`weights[key]`) won't update until the debounced callback fires 250ms later. The slider thumb jumps back to the old position on every render during the debounce window.
**Fix:** Use optimistic local state for the slider value and debounce only the upstream update, or remove the debounce entirely since `onUpdateWeight` just sets state.

---

## 4. Rendering Performance

### No Virtualization on Score Tables
**Severity:** warning
**Where:** `src/components/panels/ScoresPanel.tsx` (local fallback), `src/components/panels/BudgetPanel.tsx` (waste ranking)
**What:** The local fallback table renders all rows into the DOM. The budget waste ranking also renders every row. With 500+ videos uploaded via Excel, these will be slow.
The API table is paginated (good), but the local fallback is not.

### Entire App Re-renders on Tab Switch
**Severity:** warning
**Where:** `src/App.tsx`
**What:** `useScorecardStore()` returns a new object every render. `App` passes individual props, but because it calls the hook, `App` itself re-renders on any state change (tab, brand, weight). The conditional rendering `{store.activeTab === "scores" && ...}` means old panels unmount and remount, losing any internal state (like page number in ScoresPanel — which is indeed lost on tab switch).

### ExcelUpload Has No Row Limit
**Severity:** warning
**Where:** `src/components/panels/ExcelUpload.tsx:131-133`
**What:** A 50k-row XLSX file will be parsed entirely into memory, then mapped through `normaliseRow`, then all valid rows stored in state. No file size check, no row limit.
**Fix:** Add a cap: `if (rows.length > 5000) { setStatus({ type: "error", msg: "..." }); return; }`

---

## 5. TypeScript

### `@ts-expect-error` Suppression
**Severity:** warning
**Where:** `src/components/panels/InputPanel.tsx:7`
**What:** `// @ts-expect-error kept for future use` on the ExcelUpload import. This is a dead import that's kept around with a TS suppression. The component is commented out at line 54.
**Fix:** Remove the import entirely. If you need it later, git history has it.

### Unused Props with Underscore Prefix
**Severity:** nit
**Where:** `src/components/panels/InputPanel.tsx:34-37`
**What:** `onAddVideo: _onAddVideo`, `onImportVideos: _onImportVideos`, `onLoadSample: _onLoadSample`, `onSaveCampaign: _onSaveCampaign`, `campaignMeta: _campaignMeta`. These are accepted as props but never used — their corresponding UI sections are commented out. This forces the parent (`App.tsx`) to pass them, which in turn forces `useScorecardStore` to expose them.
**Fix:** Remove the unused props from the interface and stop passing them from `App`.

### `Video.id` Is `number` but Generated as Float
**Severity:** warning
**Where:** `src/types/index.ts:5`, `src/hooks/use-scorecard-store.ts:33`
**What:** `id: number` with `Date.now() + Math.random()`. This creates IDs like `1712419200000.7234`. Two videos added in the same millisecond could collide. More importantly, floating-point IDs used as React keys can cause subtle reconciliation issues.
**Fix:** Use `crypto.randomUUID()` and change the type to `string`, or use an auto-incrementing counter.

---

## 6. Error States

### No Error Boundary Around Panels
**Severity:** warning
**Where:** `src/App.tsx:50-97`
**What:** If any panel throws during render (bad API data, undefined access), the entire app crashes. There's no `ErrorBoundary` wrapping the tab content.
**Fix:** Wrap the tab content area in a React error boundary.

### Loading State Race in ScoresPanel
**Severity:** warning
**Where:** `src/components/panels/ScoresPanel.tsx:27-80`
**What:** The conditional flow checks `apiData && apiData.data.length > 0` first, then `isLoading`, then `isError || !apiData`. On first render, `apiData` is `undefined` and `isLoading` is `true`, but because of `placeholderData: keepPreviousData`, when switching filters, `apiData` might have stale data from the previous filter while `isLoading` is `true`. The stale data renders instead of a loading indicator.
**This is intentional UX for pagination** (keep previous page visible while loading next), **but unintentional when switching brand filters** — the user sees the old brand's data briefly.

### `BrandsPanel` Falls Back to Hardcoded Mock Data
**Severity:** warning
**Where:** `src/components/panels/BrandsPanel.tsx:88`
**What:** `const data = brandStats.length ? brandStats : MOCK_BRAND_STATS`. If there's no real data, the user sees fake brand data with no API call. Unlike every other panel, BrandsPanel doesn't use a query for its content — it relies entirely on locally-computed `brandStats` from the store. If the user has no local videos, they see hardcoded mock data that looks real.
**Fix:** Either fetch brand stats from the API like other panels do, or clearly mark the demo state (which it partially does with the demo banner, but the data itself looks production-real).

---

## 7. Visual & UX

### No Skeleton/Placeholder on Initial Load
**Severity:** warning
**Where:** All panels
**What:** The stats row, brand filter bar, and tab content all load from API. During the initial fetch, the stats row shows "—" values, then pops in. There are no skeleton loaders — the layout shifts when data arrives.

### Dark Mode Not Persisted
**Severity:** nit
**Where:** `src/hooks/use-theme.ts`
**What:** Theme preference is `useState(false)` — always starts in light mode. Doesn't read `localStorage` or `prefers-color-scheme`. If a user toggles dark mode and refreshes, they're back to light.
**Fix:** Init from `localStorage` and/or `matchMedia('(prefers-color-scheme: dark)')`.

### No System Theme Detection
**Severity:** nit
**Where:** `src/hooks/use-theme.ts`
**What:** The CLAUDE.md spec says "system preference aware" but the hook ignores `prefers-color-scheme` entirely.

### Red/Green Color Accessibility
**Severity:** warning
**Where:** `src/lib/constants.ts:80-85`
**What:** `scoreColor` uses green (#10b981) for good, red (#ef4444) for bad. There's no secondary indicator (icon, pattern, label) for colorblind users. ~8% of men cannot distinguish these.

---

## 8. Quick Wins

1. **Extract `BASE_URL`** into one env-driven constant — 5 minutes, eliminates 5 duplications.
2. **Reset page on brand filter change** in `ScoresPanel` — 1 line fix, eliminates the empty-page bug.
3. **Normalize weights** in `scoreVideo` — 2 lines, eliminates garbage scores.
4. **Guard `v.views === 0`** in scoring — 3 lines, eliminates NaN propagation.
5. **Remove dead code** in InputPanel (unused props, commented-out form, `@ts-expect-error`) — reduces noise for the next developer.
6. **Persist dark mode** to localStorage — 5 lines in `useTheme`.

---

## 9. What's Solid

- **TanStack Query usage** is clean. Query keys include all filter dimensions. `staleTime` is set appropriately. `placeholderData: keepPreviousData` for pagination is the right call.
- **Fallback pattern** (API → local data) is a reasonable resilience strategy during the API transition period.
- **Component file sizes** are reasonable — nothing over 370 lines. The split between panels is logical.
- **Tailwind usage** is consistent — `cn()` helper, CSS variables for theming, no inline `style={}` for layout (only for dynamic colors, which is correct).
- **Type safety** is generally good — no `any` in the codebase (except the suppressed import). Interfaces are well-defined.
- **`formatCost`** handles Indian numbering (Lakh/Crore) correctly, which is a nice touch for the target audience.
- **Pagination component** with ellipsis logic is well-implemented.
