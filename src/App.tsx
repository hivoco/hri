import { Toaster } from "sonner";
import { Header } from "./components/layout/Header";
import { TabBar } from "./components/layout/Tabs";
import { StatsRow } from "./components/dashboard/StatsRow";
import { BrandFilterBar } from "./components/dashboard/BrandFilterBar";
import { InputPanel } from "./components/panels/InputPanel";
import { ScoresPanel } from "./components/panels/ScoresPanel";
import { ThemesPanel } from "./components/panels/ThemesPanel";
import { BudgetPanel } from "./components/panels/BudgetPanel";
import { BrandsPanel } from "./components/panels/BrandsPanel";
import { useScorecardStore } from "./hooks/use-scorecard-store";
import { useTheme } from "./hooks/use-theme";
import { useSummary } from "./hooks/use-summary";

export function App() {
  const store = useScorecardStore();
  const { isDark, toggle } = useTheme();
  const { data: apiSummary } = useSummary(store.activeBrandFilter, store.weights);

  const stats = {
    videoCount: apiSummary?.videos_tracked ?? store.stats.videoCount,
    avgScore: apiSummary?.avg_score ?? store.stats.avgScore,
    bestTheme: apiSummary?.best_theme ?? store.stats.bestTheme,
    topCreator: apiSummary?.top_creator ?? store.stats.topCreator,
    budgetAtRisk: apiSummary?.budget_at_risk ?? store.stats.budgetAtRisk,
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="mx-auto max-w-[1400px] px-6 relative z-1">
        <Header isDark={isDark} onToggleTheme={toggle} />
        <TabBar activeTab={store.activeTab} onTabChange={store.setActiveTab} />
        <StatsRow
          videoCount={stats.videoCount}
          avgScore={stats.avgScore}
          bestTheme={stats.bestTheme}
          topCreator={stats.topCreator}
          budgetAtRisk={stats.budgetAtRisk}
        />
        <BrandFilterBar
          activeBrand={store.activeBrandFilter}
          onBrandChange={store.setActiveBrandFilter}
        />

        {store.activeTab === "input" && (
          <InputPanel
            videos={store.videos}
            weights={store.weights}
            totalWeight={store.totalWeight}
            onAddVideo={store.addVideo}
            onRemoveVideo={store.removeVideo}
            onImportVideos={store.importVideos}
            onLoadSample={store.loadSampleData}
            onUpdateWeight={store.updateWeight}
            onResetWeights={store.resetWeights}
            onSaveCampaign={store.setCampaignMeta}
            campaignMeta={store.campaignMeta}
            filteredVideos={store.filteredVideos}
            activeBrandFilter={store.activeBrandFilter}
          />
        )}

        {store.activeTab === "scores" && (
          <ScoresPanel
            scoredVideos={store.scoredVideos}
            activeBrandFilter={store.activeBrandFilter}
            weights={store.weights}
          />
        )}

        {store.activeTab === "themes" && (
          <ThemesPanel
            themeStats={store.themeStats}
            activeBrandFilter={store.activeBrandFilter}
            weights={store.weights}
          />
        )}

        {store.activeTab === "budget" && (
          <BudgetPanel
            scoredVideos={store.scoredVideos}
            activeBrandFilter={store.activeBrandFilter}
            weights={store.weights}
          />
        )}

        {store.activeTab === "brands" && (
          <BrandsPanel
            weights={store.weights}
            onDrillBrand={store.drillBrand}
          />
        )}
      </div>
    </>
  );
}
