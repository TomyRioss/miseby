"use client";

import { toast } from "sonner";
import { THEME_PRESETS, themeButtonClass, type MiseLinkTheme } from "@/lib/miselink/theme";
import { OptionGrid, ColorField } from "./design-controls";

export type PatchFn = (next: Partial<MiseLinkTheme>) => void;

function Label({ children }: { children: string }) {
  return <p className="text-[13px] font-semibold text-foreground">{children}</p>;
}

function MiniLayout({ id, active }: { id: string; active: boolean }) {
  const avatar =
    id === "hero"
      ? "rounded-lg"
      : id === "banner"
        ? "rounded-full ring-2 ring-white/70 -mt-4"
        : id === "cutout"
          ? "rounded-[8px] w-7"
          : id === "shape"
            ? "rounded-[50%_50%_45%_55%/55%_50%_50%_45%] w-9"
            : "rounded-full";
  return (
    <span
      className={`flex flex-col items-center gap-1.5 rounded-xl border bg-white px-2 py-3 ${active ? "border-foreground ring-2 ring-foreground/15" : "border-border"}`}
    >
      {id === "banner" ? <span className="h-5 w-full rounded-t-lg bg-slate-300" /> : null}
      <span className={`flex h-8 w-8 items-center justify-center bg-slate-300 ${avatar}`}>
        <span className="h-3 w-3 rounded-full bg-white/90" />
      </span>
      <span className="h-1.5 w-10 rounded-full bg-slate-800" />
      <span className="h-1 w-7 rounded-full bg-slate-300" />
    </span>
  );
}

export function HeaderDetail({
  theme,
  patch,
  page,
}: {
  theme: MiseLinkTheme;
  patch: PatchFn;
  page: { username: string; displayName: string | null; bio: string | null; avatarUrl: string | null };
}) {
  const layouts = ["classic", "hero", "banner", "cutout", "shape"] as const;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Layout</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {layouts.map((id) => (
            <button key={id} type="button" onClick={() => patch({ header: id })} className="flex flex-col gap-1.5">
              <MiniLayout id={id} active={theme.header === id} />
              <span className={`text-center text-xs font-medium capitalize ${theme.header === id ? "text-foreground" : "text-muted-foreground"}`}>
                {id}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Profile image</Label>
          <p className="text-xs text-muted-foreground">Se edita en Links → Perfil</p>
        </div>
        <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-muted text-xs text-muted-foreground">
          {page.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            "Sin foto"
          )}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Title</Label>
        <div className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">@{page.username}</div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Bio</Label>
        <div className="min-h-[72px] rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
          {page.bio || page.displayName || "—"}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Title style</Label>
        <div className="grid grid-cols-2 gap-2">
          <span className="rounded-xl border border-foreground bg-background px-3 py-3 text-center">
            <span className="block text-base font-bold">Aa</span>
            <span className="block text-xs text-muted-foreground">Text</span>
          </span>
          <button
            type="button"
            onClick={() => toast.info("Logo disponible próximamente")}
            className="rounded-xl border border-border bg-background px-3 py-3 text-center opacity-70 hover:opacity-100"
          >
            <span className="block text-base font-bold">▦</span>
            <span className="block text-xs text-muted-foreground">Logo</span>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Title color</Label>
          <p className="text-xs text-muted-foreground">Igual que el texto de la página</p>
        </div>
        <ColorField label="Título" value={theme.colors.text} onChange={(text) => patch({ colors: { ...theme.colors, text } })} />
      </div>
    </div>
  );
}

export function WallpaperDetail({ theme, patch }: { theme: MiseLinkTheme; patch: PatchFn }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Style</Label>
        <OptionGrid
          value={theme.wallpaper}
          onChange={(wallpaper) => patch({ wallpaper })}
          options={[
            { id: "fill", label: "Fill", hint: "Plano" },
            { id: "gradient", label: "Gradient", hint: "Degradado" },
            { id: "soft", label: "Soft", hint: "Suave" },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Background</Label>
        <ColorField
          label="Fondo"
          value={theme.colors.background}
          onChange={(background) => patch({ colors: { ...theme.colors, background } })}
        />
      </div>
      {theme.wallpaper === "gradient" ? (
        <div className="grid gap-2">
          <ColorField
            label="Desde"
            value={theme.wallpaperGradient?.from ?? "#e8eaed"}
            onChange={(from) => patch({ wallpaperGradient: { from, to: theme.wallpaperGradient?.to ?? "#d7dbe0" } })}
          />
          <ColorField
            label="Hasta"
            value={theme.wallpaperGradient?.to ?? "#d7dbe0"}
            onChange={(to) => patch({ wallpaperGradient: { from: theme.wallpaperGradient?.from ?? "#e8eaed", to } })}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ButtonsDetail({ theme, patch }: { theme: MiseLinkTheme; patch: PatchFn }) {
  const styles = ["fill", "outline", "soft", "round"] as const;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Shape</Label>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => patch({ buttonStyle: s })}
              className={`rounded-xl border p-3 ${theme.buttonStyle === s ? "border-foreground ring-2 ring-foreground/15" : "border-border"}`}
            >
              <span
                style={
                  s === "outline"
                    ? { borderColor: theme.colors.button, color: theme.colors.buttonText }
                    : { background: theme.colors.button, color: theme.colors.buttonText }
                }
                className={`flex w-full items-center justify-center border-2 px-2 py-2 text-xs font-semibold ${themeButtonClass(s)}`}
              >
                Botón
              </span>
              <span className="mt-2 block text-center text-xs capitalize text-muted-foreground">{s}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <ColorField label="Botón" value={theme.colors.button} onChange={(button) => patch({ colors: { ...theme.colors, button } })} />
        <ColorField
          label="Texto botón"
          value={theme.colors.buttonText}
          onChange={(buttonText) => patch({ colors: { ...theme.colors, buttonText } })}
        />
      </div>
    </div>
  );
}

export function TextDetail({ theme, patch }: { theme: MiseLinkTheme; patch: PatchFn }) {
  return (
    <div className="flex flex-col gap-4">
      <Label>Font</Label>
      <OptionGrid
        value={theme.font}
        onChange={(font) => patch({ font })}
        options={[
          { id: "sans", label: "Link Sans", hint: "Sans" },
          { id: "serif", label: "Serif", hint: "Clásica" },
          { id: "mono", label: "Mono", hint: "Mono" },
          { id: "round", label: "Round", hint: "Redonda" },
        ]}
      />
      <div className="rounded-xl border border-border bg-background p-4">
        <p className={`text-lg font-bold ${theme.font === "serif" ? "font-serif" : theme.font === "mono" ? "font-mono" : "font-sans"}`}>
          Aa — Así se ve tu título
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Bio y botones heredan esta familia.</p>
      </div>
    </div>
  );
}

export function ColorsDetail({ theme, patch }: { theme: MiseLinkTheme; patch: PatchFn }) {
  return (
    <div className="grid gap-2">
      <ColorField label="Fondo" value={theme.colors.background} onChange={(background) => patch({ colors: { ...theme.colors, background } })} />
      <ColorField label="Texto" value={theme.colors.text} onChange={(text) => patch({ colors: { ...theme.colors, text } })} />
      <ColorField label="Botón" value={theme.colors.button} onChange={(button) => patch({ colors: { ...theme.colors, button } })} />
      <ColorField label="Texto botón" value={theme.colors.buttonText} onChange={(buttonText) => patch({ colors: { ...theme.colors, buttonText } })} />
    </div>
  );
}

export function FooterDetail({
  theme,
  patch,
  onTextDraft,
  draft,
}: {
  theme: MiseLinkTheme;
  patch: PatchFn;
  draft: string;
  onTextDraft: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Label>Visibility</Label>
      <div className="flex gap-2">
        {([true, false] as const).map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => patch({ footerVisible: v })}
            aria-pressed={theme.footerVisible === v}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold ${theme.footerVisible === v ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted"}`}
          >
            {v ? "Visible" : "Oculto"}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Label>Custom text</Label>
        <input
          value={draft}
          onChange={(e) => onTextDraft(e.target.value)}
          onBlur={(e) => patch({ footerText: e.target.value.slice(0, 120) })}
          placeholder="Hecho con MISE BY"
          maxLength={120}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
      </div>
    </div>
  );
}

export function ThemeDetail({ theme, patch }: { theme: MiseLinkTheme; patch: PatchFn }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => patch({ ...p.theme, preset: p.id })}
          aria-pressed={theme.preset === p.id}
          style={{ background: p.theme.colors.background, color: p.theme.colors.text }}
          className={`rounded-xl border px-3 py-3 text-left ${theme.preset === p.id ? "border-foreground ring-2 ring-foreground/20" : "border-border"}`}
        >
          <span className="block text-sm font-bold">{p.label}</span>
          <span
            className="mt-2 block rounded-full px-2 py-1 text-center text-xs font-semibold"
            style={{ background: p.theme.colors.button, color: p.theme.colors.buttonText }}
          >
            Botón
          </span>
        </button>
      ))}
    </div>
  );
}
