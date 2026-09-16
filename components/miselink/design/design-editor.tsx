"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, CircleUserRound, Image as ImageIcon, RectangleHorizontal, Type, Palette, SwatchBook } from "lucide-react";
import { toast } from "sonner";
import { updateThemeAction } from "@/lib/actions/miselink";
import { THEME_PRESETS, type MiseLinkTheme } from "@/lib/miselink/theme";
import { DesignRow } from "./design-row";
import { MiseLinkPhonePreview } from "@/components/miselink/render/miselink-phone-preview";
import { ShareDialog } from "@/components/miselink/editor/share-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { HeaderDetail, WallpaperDetail, ButtonsDetail, TextDetail, ColorsDetail, ThemeDetail } from "./design-details";

type Section = "theme" | "header" | "wallpaper" | "buttons" | "text" | "colors";
type PreviewItem = { id: string; title: string | null; url: string | null };
type PreviewSocial = { id: string; network: string; url: string };

const TITLES: Record<Section, string> = {
  theme: "Tema",
  header: "Encabezado",
  wallpaper: "Fondo",
  buttons: "Botones",
  text: "Texto",
  colors: "Colores",
};

const HEADER_LABELS: Record<string, string> = {
  classic: "Clásico",
  hero: "Destacado",
  banner: "Portada",
  cutout: "Recorte",
  shape: "Forma",
  compact: "Compacto",
};

const WALLPAPER_LABELS: Record<string, string> = {
  fill: "Relleno",
  gradient: "Degradado",
  soft: "Suave",
};

const BUTTON_STYLE_LABELS: Record<string, string> = {
  fill: "Relleno",
  outline: "Contorno",
  soft: "Suave",
  round: "Redondo",
};

const FONT_LABELS: Record<string, string> = {
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
  round: "Redonda",
};

const SECTIONS: Section[] = ["theme", "header", "wallpaper", "buttons", "text", "colors"];

function sectionPayload(section: Section, t: MiseLinkTheme): Partial<MiseLinkTheme> {
  switch (section) {
    case "theme":
      return { ...t };
    case "header":
      return { header: t.header, bannerFade: t.bannerFade, colors: { ...t.colors, text: t.colors.text } };
    case "wallpaper":
      return {
        wallpaper: t.wallpaper,
        wallpaperGradient: t.wallpaperGradient ? { ...t.wallpaperGradient } : undefined,
        colors: { ...t.colors, background: t.colors.background },
      };
    case "buttons":
      return {
        buttonStyle: t.buttonStyle,
        colors: { ...t.colors, button: t.colors.button, buttonText: t.colors.buttonText },
      };
    case "text":
      return { font: t.font };
    case "colors":
      return { colors: { ...t.colors } };
  }
}

function narrowPayload(section: Section, t: MiseLinkTheme): Record<string, unknown> {
  switch (section) {
    case "theme":
      return { ...t };
    case "header":
      return { header: t.header, bannerFade: t.bannerFade, colors: { text: t.colors.text } };
    case "wallpaper":
      return {
        wallpaper: t.wallpaper,
        ...(t.wallpaperGradient ? { wallpaperGradient: { ...t.wallpaperGradient } } : {}),
        colors: { background: t.colors.background },
      };
    case "buttons":
      return { buttonStyle: t.buttonStyle, colors: { button: t.colors.button, buttonText: t.colors.buttonText } };
    case "text":
      return { font: t.font };
    case "colors":
      return { colors: { ...t.colors } };
  }
}

function applyDiscard(prev: MiseLinkTheme, savedTheme: MiseLinkTheme, section: Section): MiseLinkTheme {
  switch (section) {
    case "theme":
      return { ...savedTheme };
    case "header":
      return { ...prev, header: savedTheme.header, bannerFade: savedTheme.bannerFade, colors: { ...prev.colors, text: savedTheme.colors.text } };
    case "wallpaper":
      return {
        ...prev,
        wallpaper: savedTheme.wallpaper,
        wallpaperGradient: savedTheme.wallpaperGradient ? { ...savedTheme.wallpaperGradient } : prev.wallpaperGradient,
        colors: { ...prev.colors, background: savedTheme.colors.background },
      };
    case "buttons":
      return {
        ...prev,
        buttonStyle: savedTheme.buttonStyle,
        colors: { ...prev.colors, button: savedTheme.colors.button, buttonText: savedTheme.colors.buttonText },
      };
    case "text":
      return { ...prev, font: savedTheme.font };
    case "colors":
      return { ...prev, colors: { ...savedTheme.colors } };
  }
}

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
  const [draft, setDraft] = useState(initialTheme);
  const [saved, setSaved] = useState(initialTheme);
  const [section, setSection] = useState<Section | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);

  function updateDraft(next: Partial<MiseLinkTheme>) {
    setDraft((t) => ({
      ...t,
      ...next,
      colors: next.colors ? { ...t.colors, ...next.colors } : t.colors,
      wallpaperGradient: next.wallpaperGradient ? { ...t.wallpaperGradient, ...next.wallpaperGradient } : t.wallpaperGradient,
    }));
  }

  function isDirty(s: Section) {
    return JSON.stringify(sectionPayload(s, draft)) !== JSON.stringify(sectionPayload(s, saved));
  }

  const dirtyCount = SECTIONS.filter(isDirty).length;
  const currentDirty = section ? isDirty(section) : false;

  function saveSection(s: Section) {
    if (!isDirty(s)) return;
    startTransition(async () => {
      try {
        const res = await updateThemeAction(narrowPayload(s, draft));
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setSaved(draft);
        setSavedAt(new Date().toLocaleTimeString());
        toast.success(`${TITLES[s]} guardado`);
      } catch (e) {
        console.error("[design save]", e);
        toast.error("No se pudo guardar el diseño.");
      }
    });
  }

  function discardSection(s: Section) {
    setDraft((prev) => applyDiscard(prev, saved, s));
  }

  const presetLabel = THEME_PRESETS.find((p) => p.id === draft.preset)?.label ?? draft.preset;
  const iconCls = "h-4 w-4";

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_auto_360px]">
      <div className="flex min-w-0 flex-col gap-3">
        {section === null ? (
          <>
            <div className="flex items-center justify-between px-1">
              <h1 className="text-2xl font-semibold">Diseño</h1>
              <span className="text-xs text-muted-foreground">
                {pending ? "Guardando…" : dirtyCount > 0 ? `Sin guardar (${dirtyCount})` : savedAt ? `Guardado ${savedAt}` : ""}
              </span>
            </div>
            <DesignRow icon={<SwatchBook className={iconCls} />} label="Tema" value={presetLabel} onOpen={() => setSection("theme")} />
            <p className="px-1 pt-3 text-sm font-semibold text-muted-foreground">Personalizar</p>
            <DesignRow icon={<CircleUserRound className={iconCls} />} label="Encabezado" value={HEADER_LABELS[draft.header] ?? draft.header} onOpen={() => setSection("header")} />
            <DesignRow icon={<ImageIcon className={iconCls} />} label="Fondo" value={WALLPAPER_LABELS[draft.wallpaper] ?? draft.wallpaper} onOpen={() => setSection("wallpaper")} />
            <DesignRow icon={<RectangleHorizontal className={iconCls} />} label="Botones" value={BUTTON_STYLE_LABELS[draft.buttonStyle] ?? draft.buttonStyle} onOpen={() => setSection("buttons")} />
            <DesignRow icon={<Type className={iconCls} />} label="Texto" value={FONT_LABELS[draft.font] ?? draft.font} onOpen={() => setSection("text")} />
            <DesignRow icon={<Palette className={iconCls} />} label="Colores" onOpen={() => setSection("colors")} />
          </>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => setSection(null)} className="flex items-center gap-2 text-left">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-lg font-bold">{TITLES[section]}</span>
              </button>
              <span className={`text-xs font-medium ${currentDirty ? "text-amber-600" : "text-muted-foreground"}`}>
                {pending ? "Guardando…" : currentDirty ? "Sin guardar" : "Al día"}
              </span>
            </div>
            {section === "theme" ? <ThemeDetail theme={draft} patch={updateDraft} /> : null}
            {section === "header" ? (
              <HeaderDetail theme={draft} patch={updateDraft} page={{ username, ...page }} />
            ) : null}
            {section === "wallpaper" ? <WallpaperDetail theme={draft} patch={updateDraft} /> : null}
            {section === "buttons" ? <ButtonsDetail theme={draft} patch={updateDraft} /> : null}
            {section === "text" ? <TextDetail theme={draft} patch={updateDraft} /> : null}
            {section === "colors" ? <ColorsDetail theme={draft} patch={updateDraft} /> : null}

            <div className="sticky bottom-0 -mx-1 flex flex-col gap-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur sm:flex-row sm:items-center">
              <p className="flex-1 text-xs text-muted-foreground">Probá tranquilo: la vista previa es instantánea y solo se guarda al confirmar.</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" disabled={!currentDirty || pending} onClick={() => discardSection(section)}>
                  Descartar
                </Button>
                <Button type="button" disabled={!currentDirty || pending} onClick={() => saveSection(section)}>
                  {pending ? "Guardando…" : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Separator orientation="vertical" className="hidden lg:block" />

      <aside className="hidden lg:block">
        <div className="sticky top-6 h-[calc(100vh-8rem)] max-h-[760px] w-[360px]">
          <MiseLinkPhonePreview username={username} page={page} items={items} socials={socials} theme={draft} onShare={() => setShareOpen(true)} />
        </div>
      </aside>
      <div className="h-[620px] lg:hidden">
        <MiseLinkPhonePreview username={username} page={page} items={items} socials={socials} theme={draft} onShare={() => setShareOpen(true)} />
      </div>
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        username={username}
        displayName={page.displayName}
      />
    </div>
  );
}
