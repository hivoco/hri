import { THEME_COLORS } from "./constants";

const themeColorMap: Record<string, [string, string]> = {};
let themeColorIdx = 0;

export function getThemeColor(theme: string): [string, string] {
  if (!themeColorMap[theme]) {
    themeColorMap[theme] = THEME_COLORS[themeColorIdx % THEME_COLORS.length]!;
    themeColorIdx++;
  }
  return themeColorMap[theme]!;
}
