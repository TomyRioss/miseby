export type ThemeHeader = "classic" | "hero" | "banner" | "cutout" | "shape" | "compact";
export type ThemeWallpaper = "fill" | "gradient" | "soft";
export type ThemeButtonStyle = "fill" | "outline" | "soft" | "round";
export type ThemeFont = "sans" | "serif" | "mono" | "round";

export type MiseLinkTheme = {
  preset: string;
  header: ThemeHeader;
  wallpaper: ThemeWallpaper;
  buttonStyle: ThemeButtonStyle;
  font: ThemeFont;
  colors: { background: string; text: string; button: string; buttonText: string };
  wallpaperGradient?: { from: string; to: string };
  footerVisible: boolean;
  footerText?: string;
  bannerVisible?: boolean;
  bannerImage?: string;
  bannerFade?: number;
};

export const THEME_DEFAULT: MiseLinkTheme = {
  preset: "air",
  header: "classic",
  wallpaper: "fill",
  buttonStyle: "fill",
  font: "sans",
  colors: { background: "#e8eaed", text: "#171717", button: "#ffffff", buttonText: "#171717" },
  wallpaperGradient: { from: "#e8eaed", to: "#d7dbe0" },
  footerVisible: true,
  footerText: "",
  bannerFade: 75,
};

export type ThemePreset = { id: string; label: string; theme: MiseLinkTheme };

export const THEME_PRESETS: ThemePreset[] = [
  { id: "air", label: "Aire", theme: { ...THEME_DEFAULT, preset: "air" } },
  {
    id: "niebla",
    label: "Niebla",
    theme: {
      ...THEME_DEFAULT,
      preset: "niebla",
      wallpaper: "gradient",
      colors: { background: "#f4f1ea", text: "#1c1917", button: "#1c1917", buttonText: "#fafaf9" },
      wallpaperGradient: { from: "#f4f1ea", to: "#e2d9c8" },
    },
  },
  {
    id: "noche",
    label: "Noche",
    theme: {
      ...THEME_DEFAULT,
      preset: "noche",
      wallpaper: "fill",
      buttonStyle: "soft",
      colors: { background: "#0f0f12", text: "#fafafa", button: "#27272a", buttonText: "#fafafa" },
      wallpaperGradient: { from: "#0f0f12", to: "#27272a" },
    },
  },
  {
    id: "mar",
    label: "Mar",
    theme: {
      ...THEME_DEFAULT,
      preset: "mar",
      wallpaper: "gradient",
      buttonStyle: "round",
      colors: { background: "#0a2540", text: "#ffffff", button: "#ffffff", buttonText: "#0a2540" },
      wallpaperGradient: { from: "#0a2540", to: "#00b4d8" },
    },
  },
];

export function normalizeTheme(raw: unknown): MiseLinkTheme {
  const t = (raw ?? {}) as Partial<MiseLinkTheme>;
  const colors = { ...THEME_DEFAULT.colors, ...(t.colors ?? {}) };
  const gradient = { ...THEME_DEFAULT.wallpaperGradient!, ...(t.wallpaperGradient ?? {}) };
  return {
    preset: typeof t.preset === "string" ? t.preset : THEME_DEFAULT.preset,
    header:
      t.header === "hero" ||
      t.header === "banner" ||
      t.header === "cutout" ||
      t.header === "shape" ||
      t.header === "compact"
        ? t.header
        : "classic",
    wallpaper: t.wallpaper === "gradient" || t.wallpaper === "soft" ? t.wallpaper : "fill",
    buttonStyle:
      t.buttonStyle === "outline" || t.buttonStyle === "soft" || t.buttonStyle === "round"
        ? t.buttonStyle
        : "fill",
    font: t.font === "serif" || t.font === "mono" || t.font === "round" ? t.font : "sans",
  colors,
  wallpaperGradient: gradient,
  footerVisible: t.footerVisible !== false,
  footerText: typeof t.footerText === "string" ? t.footerText.slice(0, 120) : "",
  bannerVisible: t.bannerVisible === true,
  bannerImage: typeof t.bannerImage === "string" ? t.bannerImage.slice(0, 2000) : "",
  bannerFade:
    typeof t.bannerFade === "number" && Number.isFinite(t.bannerFade)
      ? Math.min(100, Math.max(0, Math.round(t.bannerFade)))
      : 75,
};
}

export function themeBackground(theme: MiseLinkTheme): string {
  if (theme.wallpaper === "gradient" && theme.wallpaperGradient) {
    return `linear-gradient(180deg, ${theme.wallpaperGradient.from} 0%, ${theme.wallpaperGradient.to} 100%)`;
  }
  return theme.colors.background;
}

export function themeFontClass(font: ThemeFont): string {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono";
  return "font-sans";
}

export function themeButtonClass(style: ThemeButtonStyle): string {
  if (style === "outline") return "rounded-[10px] border-2 bg-transparent";
  if (style === "soft") return "rounded-[16px]";
  if (style === "round") return "rounded-full";
  return "rounded-[10px]";
}
