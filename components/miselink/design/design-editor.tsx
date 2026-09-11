"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CircleUserRound, Image as ImageIcon, RectangleHorizontal, Type, Palette, Asterisk, SwatchBook } from "lucide-react";
import { toast } from "sonner";
import { updateThemeAction } from "@/lib/actions/miselink";
import { THEME_PRESETS, type MiseLinkTheme } from "@/lib/miselink/theme";
import { DesignRow } from "./design-row";
import { DesignPreview } from "./design-preview";
import { HeaderDetail, WallpaperDetail, ButtonsDetail, TextDetail, ColorsDetail, FooterDetail, ThemeDetail } from "./design-details";

type Section = "theme" | "header" | "wallpaper" | "buttons" | "text" | "colors" | "footer";
type PreviewItem = { id: string; title: string | null; url: string | null };
type PreviewSocial = { id: string; network: string; url: string };

const TITLES: Record<Section, string> = {
  theme: "Theme",
  header: "Header",
  wallpaper: "Wallpaper",
  buttons: "Buttons",
  text: "Text",
  colors: "Colors",
  footer: "Footer",
};

export function DesignEditor({
  username,
  initialTheme,
  page,
  items,
  socials,
}: {
  username: string;
  initialTheme: MiseLinkTheme;
  page: { displayName: string | null; bio: string | null; avatarUrl: string | null };
  items: PreviewItem[];
  socials: PreviewSocial[];
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [section, setSection] = useState<Section | null>(null);
  const [draftFooter, setDraftFooter] = useState(initialTheme.footerText ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(next: Partial<MiseLinkTheme>) {
    setTheme((t) => ({ ...t, ...next }));
    startTransition(async () => {
      try {
        const res = await updateThemeAction(next);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setSavedAt(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("[design save]", e);
        toast.error("No se pudo guardar el diseño.");
      }
    });
  }

  const presetLabel = THEME_PRESETS.find((p) => p.id === theme.preset)?.label ?? theme.preset;
  const iconCls = "h-4 w-4";

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-3">
        {section === null ? (
          <>
            <div className="flex items-center justify-between px-1">
              <h1 className="text-2xl font-semibold">Design</h1>
              <span className="text-xs text-muted-foreground">
                {pending ? "Guardando…" : savedAt ? `Guardado ${savedAt}` : ""}
              </span>
            </div>
            <DesignRow icon={<SwatchBook className={iconCls} />} label="Theme" value={presetLabel} onOpen={() => setSection("theme")} />
            <p className="px-1 pt-3 text-sm font-semibold text-muted-foreground">Customize</p>
            <DesignRow icon={<CircleUserRound className={iconCls} />} label="Header" value={theme.header} onOpen={() => setSection("header")} />
            <DesignRow icon={<ImageIcon className={iconCls} />} label="Wallpaper" value={theme.wallpaper} onOpen={() => setSection("wallpaper")} />
            <DesignRow icon={<RectangleHorizontal className={iconCls} />} label="Buttons" value={theme.buttonStyle} onOpen={() => setSection("buttons")} />
            <DesignRow icon={<Type className={iconCls} />} label="Text" value={theme.font} onOpen={() => setSection("text")} />
            <DesignRow icon={<Palette className={iconCls} />} label="Colors" onOpen={() => setSection("colors")} />
            <DesignRow
              icon={<Asterisk className={iconCls} />}
              label="Footer"
              value={theme.footerVisible ? "Visible" : "Oculto"}
              onOpen={() => setSection("footer")}
            />
          </>
        ) : (
          <div className="flex flex-col gap-5">
            <button type="button" onClick={() => setSection(null)} className="flex items-center gap-2 text-left">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-lg font-bold">{TITLES[section]}</span>
            </button>
            {section === "theme" ? <ThemeDetail theme={theme} patch={patch} /> : null}
            {section === "header" ? (
              <HeaderDetail theme={theme} patch={patch} page={{ username, ...page }} />
            ) : null}
            {section === "wallpaper" ? <WallpaperDetail theme={theme} patch={patch} /> : null}
            {section === "buttons" ? <ButtonsDetail theme={theme} patch={patch} /> : null}
            {section === "text" ? <TextDetail theme={theme} patch={patch} /> : null}
            {section === "colors" ? <ColorsDetail theme={theme} patch={patch} /> : null}
            {section === "footer" ? (
              <FooterDetail theme={theme} patch={patch} draft={draftFooter} onTextDraft={(v) => { setDraftFooter(v); setTheme((t) => ({ ...t, footerText: v })); }} />
            ) : null}
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <DesignPreview username={username} page={page} items={items} socials={socials} theme={theme} />
        </div>
      </aside>
      <div className="lg:hidden">
        <DesignPreview username={username} page={page} items={items} socials={socials} theme={theme} />
      </div>
    </div>
  );
}
