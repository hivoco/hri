import { useState, useRef } from "react";
import type { Video, AudienceType } from "@/types";
import { BRANDS } from "@/lib/constants";
import { formatViews, formatCost } from "@/lib/utils";
import { SectionCard } from "./InputPanel";

interface ExcelUploadProps {
  onImportVideos: (videos: Omit<Video, "id">[]) => void;
}

type UploadStatus = { type: "error" | "success" | "info"; msg: string } | null;

const BRAND_LIST_MAP: Record<string, string> = {};
BRANDS.forEach((b) => {
  BRAND_LIST_MAP[b.toLowerCase()] = b;
  BRAND_LIST_MAP[b.toLowerCase().replace(/\s/g, "")] = b;
});

const PLAT_MAP: Record<string, string> = {
  "instagram reels": "Instagram Reels",
  instagram: "Instagram Reels",
  reels: "Instagram Reels",
  ig: "Instagram Reels",
  "youtube shorts": "YouTube Shorts",
  shorts: "YouTube Shorts",
  youtube: "YouTube (long)",
  "youtube (long)": "YouTube (long)",
  yt: "YouTube (long)",
  tiktok: "TikTok",
  "tik tok": "TikTok",
  tt: "TikTok",
};

const AUD_MAP: Record<string, AudienceType> = {
  high: "high",
  "25-40": "high",
  "25\u201340": "high",
  medium: "medium",
  mid: "medium",
  "20-30": "medium",
  "20\u201330": "medium",
  low: "low",
  "13-22": "low",
  "13\u201322": "low",
};

function getField(raw: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const val = raw[k] ?? raw[k.toLowerCase()] ?? raw[k.replace(/ /g, "").toLowerCase()];
    if (val !== undefined && val !== "") return val;
  }
  return "";
}

function normaliseRow(raw: Record<string, string>): Omit<Video, "id"> | null {
  const creator = String(getField(raw, "creator", "creator name", "creatorname")).trim();
  const theme = String(getField(raw, "theme", "content theme", "contenttheme")).trim();
  const views = parseFloat(getField(raw, "views") || "0");

  if (!creator || isNaN(views) || views <= 0) return null;

  const platRaw = String(getField(raw, "platform") || "Instagram Reels").trim().toLowerCase();
  const audRaw = String(getField(raw, "audience", "target audience", "targetaudience") || "medium").trim().toLowerCase();
  const brandRaw = String(getField(raw, "brand", "brand name", "brandname", "product", "product name") || "").trim().toLowerCase();

  return {
    creator,
    theme,
    brand: BRAND_LIST_MAP[brandRaw] ?? (brandRaw || ""),
    platform: PLAT_MAP[platRaw] ?? "Instagram Reels",
    views,
    eng: parseFloat(getField(raw, "engagement", "eng", "engagementrate", "engagement rate") || "0"),
    watch: parseFloat(getField(raw, "watchtime", "watch time", "watch", "watch%") || "0"),
    cost: parseFloat(getField(raw, "cost", "creator cost", "creatorcost", "cost (inr)") || "0"),
    cpv: parseFloat(getField(raw, "cpv", "cost per view", "costperview") || "0"),
    audience: AUD_MAP[audRaw] ?? "medium",
  };
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const firstLine = lines[0];
  if (!firstLine) return [];
  const headers = firstLine.split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] ?? "").trim();
    });
    return obj;
  });
}

const STATUS_CLS: Record<string, string> = {
  error: "bg-[#fdf2f2] text-[#d64040] border border-[#fca5a5]",
  success: "bg-[#edfaf4] text-[#0f6b47] border border-[#a7f3d0]",
  info: "bg-[#eff4ff] text-[#1e40af] border border-[#bfdbfe]",
};

const BTN_PRIMARY = "rounded-lg border-none bg-accent px-5 py-2.5 font-gilroy-bold text-[13px] font-bold tracking-wide text-white cursor-pointer transition-all hover:bg-[#6d28d9] hover:-translate-y-px";

const BTN_SECONDARY = "rounded-lg border-none bg-border px-5 py-2.5 font-gilroy-bold text-[13px] font-bold tracking-wide text-muted2 cursor-pointer transition-all hover:bg-[#d1d5db] hover:text-text dark:bg-[#334155] dark:text-[#cbd5e1] dark:hover:bg-[#475569] dark:hover:text-[#f1f5f9]";

export function ExcelUpload({ onImportVideos }: ExcelUploadProps) {
  const [fileName, setFileName] = useState("No file chosen");
  const [status, setStatus] = useState<UploadStatus>(null);
  const [preview, setPreview] = useState<Omit<Video, "id">[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      let rows: Record<string, string>[];

      if (isCSV) {
        const text = await file.text();
        rows = parseCSV(text);
      } else {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const firstSheet = wb.SheetNames[0];
        if (!firstSheet) {
          setStatus({ type: "error", msg: "\u274C File has no sheets." });
          return;
        }
        const ws = wb.Sheets[firstSheet]!;
        rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      }

      const parsed = rows.map(normaliseRow).filter((r): r is Omit<Video, "id"> => r !== null);
      const skipped = rows.length - parsed.length;

      if (!parsed.length) {
        setStatus({ type: "error", msg: "\u274C No valid rows found. Check column names match the template." });
        return;
      }

      setPreview(parsed);
      setStatus({
        type: "info",
        msg: `\uD83D\uDCCB ${parsed.length} valid rows detected from "${file.name}". Review below and confirm import.${skipped ? ` (${skipped} skipped)` : ""}`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: `\u274C Could not read file: ${err instanceof Error ? err.message : "Unknown error"}` });
    }
  };

  const handleConfirm = () => {
    if (!preview) return;
    onImportVideos(preview);
    setPreview(null);
    setFileName("No file chosen");
    if (fileRef.current) fileRef.current.value = "";
    setStatus({ type: "success", msg: `\u2705 Successfully imported ${preview.length} videos. Switch to "Scores" tab to see results.` });
  };

  const handleCancel = () => {
    setPreview(null);
    setFileName("No file chosen");
    if (fileRef.current) fileRef.current.value = "";
    setStatus(null);
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const headers = ["creator", "brand", "theme", "platform", "views", "engagement", "watchtime", "cost", "cpv", "audience"];
    const sample = [
      ["@sneha_beauty", "Streax Colour", "Hair Color Tutorial", "Instagram Reels", 500000, 5.2, 65, 80000, 0.016, "high"],
      ["@raj_vlogs", "Streax Gel", "Product Unboxing", "YouTube (long)", 800000, 4.1, 55, 60000, 0.075, "medium"],
      ["@kavya_tt", "Vasmol SHC", "Before-After", "TikTok", 1200000, 8.3, 80, 45000, 0.012, "low"],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "HRI Template");
    XLSX.writeFile(wb, "HRI-Scorecard-Template.xlsx");
  };

  return (
    <SectionCard dotColor="var(--color-success)" title="Upload Excel / CSV">
      <div className="mb-4 rounded-lg border border-accent2/20 bg-accent2/5 px-4 py-2.5 text-xs text-muted2">
        <strong>Bulk upload:</strong> Upload an Excel (.xlsx) or CSV file. Required columns:{" "}
        <strong>creator, theme, platform, views, engagement, watchtime, cost, cpv, audience</strong>. Download the template to get started.
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-5 py-2.5 font-gilroy-bold text-[13px] font-bold text-white transition-all">
          {"\uD83D\uDCC1"} Choose File
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
        </label>
        <button className={BTN_SECONDARY} onClick={handleDownloadTemplate}>
          {"\u2B07"} Download Template
        </button>
        <span className="text-xs text-muted">{fileName}</span>
      </div>

      {status && (
        <div className={`mt-3 rounded-lg px-3.5 py-2.5 text-xs ${STATUS_CLS[status.type]}`}>
          {status.msg}
        </div>
      )}

      {preview && (
        <div className="mt-4">
          <div className="mb-2.5 font-gilroy-bold text-[13px] font-bold text-text">
            Preview {"\u2014"} {preview.length} rows ready to import
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border bg-surface">
                  {["Creator", "Brand", "Theme", "Platform", "Views", "Eng%", "Watch%", "Cost \u20B9", "CPV \u20B9", "Audience"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-3 py-2">{r.creator}</td>
                    <td className="px-3 py-2">{r.brand || "\u2014"}</td>
                    <td className="px-3 py-2">{r.theme}</td>
                    <td className="px-3 py-2">{r.platform}</td>
                    <td className="px-3 py-2">{formatViews(r.views)}</td>
                    <td className="px-3 py-2">{r.eng}%</td>
                    <td className="px-3 py-2">{r.watch}%</td>
                    <td className="px-3 py-2">{formatCost(r.cost)}</td>
                    <td className="px-3 py-2">{"\u20B9"}{r.cpv}</td>
                    <td className="px-3 py-2">{r.audience}</td>
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td colSpan={10} className="px-3 py-2 italic text-muted">
                      {"\u2026"} and {preview.length - 5} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2.5">
            <button className={BTN_PRIMARY} onClick={handleConfirm}>
              {"\u2705"} Import {preview.length} Videos
            </button>
            <button className={BTN_SECONDARY} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
