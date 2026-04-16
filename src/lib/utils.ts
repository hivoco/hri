import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatViews(views: number): string {
  return formatCompact(views);
}

export function formatViewsDetailed(views: number): string {
  return (views / 100000).toFixed(2) + "L";
}

export function formatCost(cost: number): string {
  const abs = Math.abs(cost);
  if (abs >= 1_00_00_000) {
    return "\u20B9" + (cost / 1_00_00_000).toFixed(2).replace(/\.00$/, "") + "Cr";
  }
  if (abs >= 1_00_000) {
    return "\u20B9" + (cost / 1_00_000).toFixed(2).replace(/\.00$/, "") + "L";
  }
  if (abs >= 1_000) {
    return "\u20B9" + (cost / 1_000).toFixed(0) + "K";
  }
  return "\u20B9" + cost;
}

export function formatCPV(cpv: number): string {
  return "\u20B9" + cpv;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    const n = abs / 1_000_000_000;
    return sign + (n >= 100 ? Math.round(n) + "B" : n.toFixed(1).replace(/\.0$/, "") + "B");
  }
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000;
    return sign + (n >= 100 ? Math.round(n) + "M" : n.toFixed(1).replace(/\.0$/, "") + "M");
  }
  if (abs >= 1_000) {
    const n = abs / 1_000;
    return sign + (n >= 100 ? Math.round(n) + "K" : n.toFixed(1).replace(/\.0$/, "") + "K");
  }
  return sign + String(abs);
}
