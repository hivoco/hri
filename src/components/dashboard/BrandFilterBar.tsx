import { cn } from "@/lib/utils";
import { useBrands } from "@/hooks/use-brands";

export function BrandFilterBar({
  activeBrand,
  onBrandChange,
}: {
  activeBrand: string;
  onBrandChange: (brand: string) => void;
}) {
  const { data: brands = [] } = useBrands();
  const chipBase = "rounded-full border px-3.5 py-1 font-mono text-[11px] whitespace-nowrap cursor-pointer transition-all";
  const chipInactive = "border-border bg-surface text-muted2 hover:border-accent hover:text-accent dark:border-muted dark:text-text dark:bg-card";
  const chipActiveAll = "border-text bg-text font-semibold text-white dark:border-text dark:bg-text dark:text-bg";
  const chipActiveBrand = "border-accent bg-accent font-semibold text-white dark:border-accent dark:bg-accent dark:text-white";

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="mr-1 whitespace-nowrap text-[10px] uppercase tracking-[1.5px] text-muted">
        Filter by Brand
      </span>
      <button
        onClick={() => onBrandChange("all")}
        className={cn(
          chipBase,
          activeBrand === "all" ? chipActiveAll : chipInactive
        )}
      >
        All Brands
      </button>
      {brands.map((b) => (
        <button
          key={b.id}
          onClick={() => onBrandChange(b.name)}
          className={cn(
            chipBase,
            activeBrand === b.name ? chipActiveBrand : chipInactive
          )}
        >
          {b.name}
        </button>
      ))}
    </div>
  );
}
