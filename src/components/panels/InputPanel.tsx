import { useState } from "react";
import type { Video, Weights, CampaignMeta } from "@/types";
import { getPlatformIcon, BRAND_COLORS, scoreColor } from "@/lib/constants";
import { scoreVideo } from "@/lib/scoring";
import { formatViews, cn } from "@/lib/utils";
import { WeightControls } from "./WeightControls";

const INPUT_CLS = "w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-[13px] text-text outline-none transition-colors focus:border-accent placeholder:text-muted";

const BTN_SECONDARY = "rounded-lg border-none bg-border px-5 py-2.5 font-gilroy-bold text-[13px] font-bold tracking-wide text-muted2 transition-all hover:bg-[#d1d5db] hover:text-text cursor-pointer dark:bg-[#334155] dark:text-[#cbd5e1] dark:hover:bg-[#475569] dark:hover:text-[#f1f5f9]";

interface InputPanelProps {
  videos: Video[];
  weights: Weights;
  totalWeight: number;
  onAddVideo: (video: Omit<Video, "id">) => void;
  onRemoveVideo: (id: number) => void;
  onImportVideos: (videos: Omit<Video, "id">[]) => void;
  onLoadSample: () => void;
  onUpdateWeight: (key: keyof Weights, value: number) => void;
  onResetWeights: () => void;
  onSaveCampaign: (meta: CampaignMeta) => void;
  campaignMeta: CampaignMeta | null;
  filteredVideos: Video[];
  activeBrandFilter: string;
}

export function InputPanel({
  videos,
  weights,
  totalWeight,
  onRemoveVideo,
  onUpdateWeight,
  onResetWeights,
  filteredVideos,
  activeBrandFilter,
}: InputPanelProps) {
  return (
    <div>
      <WeightControls
        weights={weights}
        totalWeight={totalWeight}
        onUpdateWeight={onUpdateWeight}
        onResetWeights={onResetWeights}
      />
      {/* <CampaignSection onSaveCampaign={onSaveCampaign} campaignMeta={campaignMeta} /> */}
      {/* <ExcelUpload onImportVideos={onImportVideos} /> */}
      {/* <AddVideoForm onAddVideo={onAddVideo} onLoadSample={onLoadSample} /> */}
      {videos.length > 0 && (
        <VideoList
          videos={filteredVideos}
          weights={weights}
          onRemoveVideo={onRemoveVideo}
          activeBrandFilter={activeBrandFilter}
        />
      )}
    </div>
  );
}

export function CampaignSection({
  onSaveCampaign,
  campaignMeta,
}: {
  onSaveCampaign: (meta: CampaignMeta) => void;
  campaignMeta: CampaignMeta | null;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [period, setPeriod] = useState("");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a Campaign Name.");
      return;
    }
    onSaveCampaign({ name: name.trim(), brand: brand.trim(), period: period.trim() });
  };

  return (
    <SectionCard dotColor="var(--color-accent3)" title="Campaign Details">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-[11px] text-muted2 tracking-wide mb-1">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLS}
            placeholder="e.g. Q2 Hair Launch \u00B7 June 2025"
          />
        </div>
        <div>
          <label className="block text-[11px] text-muted2 tracking-wide mb-1">Brand / Client</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={INPUT_CLS}
            placeholder="e.g. HRI Hair Care"
          />
        </div>
        <div>
          <label className="block text-[11px] text-muted2 tracking-wide mb-1">Reporting Period</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={INPUT_CLS}
            placeholder="e.g. Jun 2025"
          />
        </div>
      </div>
      <div className="mt-1 flex gap-2.5">
        <button className={BTN_SECONDARY} onClick={handleSave}>
          {"\uD83D\uDCBE"} Save Campaign Info
        </button>
      </div>
      {campaignMeta && (
        <div className="mt-3.5 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-xs text-muted2">
          <strong className="text-accent2">Active Campaign:</strong>{" "}
          {campaignMeta.name}
          {campaignMeta.brand && ` \u00B7 ${campaignMeta.brand}`}
          {campaignMeta.period && ` \u00B7 ${campaignMeta.period}`}
        </div>
      )}
    </SectionCard>
  );
}

// function AddVideoForm({
//   onAddVideo,
//   onLoadSample,
// }: {
//   onAddVideo: (video: Omit<Video, "id">) => void;
//   onLoadSample: () => void;
// }) {
//   const { data: brands = [], isLoading: brandsLoading } = useBrands();

//   const [creator, setCreator] = useState("");
//   const [theme, setTheme] = useState("");
//   const [brand, setBrand] = useState("");
//   const [platform, setPlatform] = useState<string>("Instagram Reels");
//   const [views, setViews] = useState("");
//   const [eng, setEng] = useState("");
//   const [watch, setWatch] = useState("");
//   const [cost, setCost] = useState("");
//   const [cpv, setCpv] = useState("");
//   const [audience, setAudience] = useState<AudienceType>("high");

//   const handleAdd = () => {
//     const v = parseFloat(views);
//     const e = parseFloat(eng);
//     const w = parseFloat(watch);
//     const c = parseFloat(cost);
//     const cv = parseFloat(cpv);

//     if (!creator.trim() || !theme.trim() || !brand || isNaN(v) || isNaN(e) || isNaN(w) || isNaN(c) || isNaN(cv)) {
//       alert("Please fill all fields correctly, including Brand.");
//       return;
//     }

//     onAddVideo({
//       creator: creator.trim(),
//       theme: theme.trim(),
//       brand,
//       platform,
//       views: v,
//       eng: e,
//       watch: w,
//       cost: c,
//       cpv: cv,
//       audience,
//     });

//     setCreator("");
//     setTheme("");
//     setBrand("");
//     setViews("");
//     setEng("");
//     setWatch("");
//     setCost("");
//     setCpv("");
//   };

//   return (
//     <SectionCard dotColor="var(--color-accent)" title="Add Creator Video">
//       <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
//         <div className="col-span-2">
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Creator Name</label>
//           <input type="text" value={creator} onChange={(e) => setCreator(e.target.value)} className={INPUT_CLS} placeholder="e.g. @sneha_beauty" />
//         </div>
//         <div className="col-span-2">
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Content Theme</label>
//           <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} className={INPUT_CLS} placeholder="e.g. Hair Color Tutorial" />
//         </div>
//         <div className="col-span-2">
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Brand</label>
//           <select value={brand} onChange={(e) => setBrand(e.target.value)} className={INPUT_CLS} disabled={brandsLoading}>
//             <option value="">{brandsLoading ? "Loading brands…" : "\u2014 Select Brand \u2014"}</option>
//             {brands.map((b) => (
//               <option key={b.id} value={b.name}>{b.name}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Platform</label>
//           <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={INPUT_CLS}>
//             {PLATFORM_OPTIONS.map((p) => (
//               <option key={p} value={p}>{p}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Views</label>
//           <input type="number" value={views} onChange={(e) => setViews(e.target.value)} className={INPUT_CLS} placeholder="e.g. 500000" />
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Engagement %</label>
//           <input type="number" value={eng} onChange={(e) => setEng(e.target.value)} className={INPUT_CLS} placeholder="e.g. 4.2" step="0.1" />
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Watch Time %</label>
//           <input type="number" value={watch} onChange={(e) => setWatch(e.target.value)} className={INPUT_CLS} placeholder="e.g. 65" step="1" />
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Cost per Creator ({"\u20B9"})</label>
//           <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className={INPUT_CLS} placeholder="e.g. 50000" />
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">CPV ({"\u20B9"} per view)</label>
//           <input type="number" value={cpv} onChange={(e) => setCpv(e.target.value)} className={INPUT_CLS} placeholder="e.g. 0.10" step="0.01" />
//         </div>
//         <div>
//           <label className="block text-[11px] text-muted2 tracking-wide mb-1">Target Audience Age</label>
//           <select value={audience} onChange={(e) => setAudience(e.target.value as AudienceType)} className={INPUT_CLS}>
//             {AUDIENCE_OPTIONS.map((a) => (
//               <option key={a.value} value={a.value}>{a.label}</option>
//             ))}
//           </select>
//         </div>
//       </div>
//       <div className="mt-4">
//         <button className={BTN_PRIMARY} onClick={handleAdd}>+ Add Video</button>
//         <button className={cn(BTN_SECONDARY, "ml-2")} onClick={onLoadSample}>Load Sample Data</button>
//       </div>
//     </SectionCard>
//   );
// }

function VideoList({
  videos,
  weights,
  onRemoveVideo,
  activeBrandFilter,
}: {
  videos: Video[];
  weights: Weights;
  onRemoveVideo: (id: number) => void;
  activeBrandFilter: string;
}) {
  if (!videos.length && activeBrandFilter !== "all") {
    return (
      <SectionCard dotColor="var(--color-success)" title="Videos Added (0)">
        <div className="p-5 text-center text-xs text-muted">
          No videos for brand: <strong>{activeBrandFilter}</strong>
        </div>
      </SectionCard>
    );
  }

  if (!videos.length) return null;

  return (
    <SectionCard dotColor="var(--color-success)" title={`Videos Added (${videos.length})`}>
      {videos.map((v) => {
        const s = scoreVideo(v, weights);
        const col = scoreColor(s.total);
        const [bc, bbg] = BRAND_COLORS[v.brand] ?? ["#64748b", "#f1f5f9"];

        return (
          <div
            key={v.id}
            className="flex items-center gap-3 border-b border-border py-2.5"
          >
            <div className="text-lg">{getPlatformIcon(v.platform)}</div>
            <div className="flex-1">
              <div className="text-[13px] font-medium">{v.creator}</div>
              <div className="mt-0.5 text-[11px] text-muted">
                {v.theme} {"\u00B7"} {formatViews(v.views)} views
              </div>
              {v.brand && (
                <span
                  className="mt-0.5 inline-block rounded-xl px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: bbg, color: bc, border: `1px solid ${bc}33` }}
                >
                  {v.brand}
                </span>
              )}
            </div>
            <div
              className="inline-flex items-center justify-center w-13 h-7 rounded-md font-gilroy-bold text-sm font-extrabold"
              style={{ background: `${col}22`, color: col, border: `1px solid ${col}44` }}
            >
              {s.total}
            </div>
            <button
              className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger cursor-pointer transition-all hover:bg-danger/20"
              onClick={() => onRemoveVideo(v.id)}
            >
              {"\u2715"}
            </button>
          </div>
        );
      })}
    </SectionCard>
  );
}

/* ---- Shared sub-components ---- */

export function SectionCard({
  dotColor,
  title,
  extra,
  children,
}: {
  dotColor?: string;
  title: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-center gap-2.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: dotColor ?? "var(--color-accent)" }}
        />
        <div className="font-gilroy-bold text-base font-bold">{title}</div>
        {extra}
      </div>
      {children}
    </div>
  );
}

export function InputGroup({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <label className="block text-[11px] text-muted2 tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

