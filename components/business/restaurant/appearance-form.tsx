"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Palette } from "lucide-react";
import { toast } from "sonner";
import { saveAppearanceAction, uploadProductImageAction } from "@/lib/actions/restaurant";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct, WeekSchedule } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MenuEditorLayout } from "./menu-editor-layout";
import { CartaPhonePreview } from "./carta-phone-preview";
import { ImageCropDialog } from "@/components/miselink/editor/image-crop-dialog";

const FONTS = [
  { id: "sans", label: "Moderna", demo: "Bandeja paisa" },
  { id: "serif", label: "Clásica", demo: "Bandeja paisa" },
  { id: "mono", label: "Directa", demo: "BANDEJA PAISA" },
  { id: "round", label: "Amable", demo: "Bandeja paisa" },
] as const;

const COLORS = [
  { key: "primary", label: "Marca", hint: "Títulos y botones" },
  { key: "secondary", label: "Acento", hint: "Precios y sellos" },
  { key: "background", label: "Fondo", hint: "Base de la carta" },
  { key: "text", label: "Texto", hint: "Lectura" },
] as const;

export function AppearanceForm({
  initial,
  categories = [],
  products = [],
  currency = "COP",
  slug,
  hours,
  schedule,
  commercialNameFallback = "",
}: {
  initial: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  slug?: string;
  hours?: string;
  schedule?: WeekSchedule;
  commercialNameFallback?: string;
}) {
  const [form, setForm] = useState(() => ({
    ...initial,
    restaurantName: initial.restaurantName || commercialNameFallback || "",
  }));
  const [savedForm, setSavedForm] = useState(form);
  const draft = JSON.stringify(form) !== JSON.stringify(savedForm);
  const [saving, setSaving] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [uploading, setUploading] = useState<"logo" | "banner" | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropKind, setCropKind] = useState<"logo" | "banner">("logo");
  const [cropMime, setCropMime] = useState("");
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const displayName = form.restaurantName || commercialNameFallback || "";
  const logoInitial = displayName ? displayName.charAt(0).toUpperCase() : "R";

  function onPickFile(kind: "logo" | "banner", file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Solo JPG, PNG o WebP.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Máximo 20 MB.");
      return;
    }
    setCropKind(kind);
    setCropMime(file.type);
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function closeCrop() {
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function onCropDone(file: File) {
    const kind = cropKind;
    closeCrop();
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadProductImageAction(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      // Persistir de inmediato: si solo queda en estado local, el
      // catálogo/menú sigue mostrando el logo/portada anterior.
      const next = kind === "logo" ? { ...form, logoUrl: res.url } : { ...form, bannerUrl: res.url };
      setForm(next);
      const saved = await saveAppearanceAction(next);
      if (!saved.ok) throw new Error(saved.error);
      setSavedForm(next);
      setPreviewTick((t) => t + 1);
      toast.success(kind === "logo" ? "Logo actualizado." : "Portada actualizada.");
    } catch (e) {
      console.error("[apariencia upload]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(null);
    }
  }

  function color(k: "primary" | "secondary" | "background" | "text") {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await saveAppearanceAction(form);
      if (!res.ok) throw new Error(res.error);
      setSavedForm(form);
      setPreviewTick((t) => t + 1);
      toast.success("Apariencia aplicada a tu carta.");
    } catch (e) {
      console.error("[apariencia]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MenuEditorLayout
      left={
        <section aria-labelledby="ap-colores" className="rounded-2xl border border-border bg-card p-6">
        <h2 id="ap-colores" className="mt-1 flex items-center gap-2 text-base font-semibold tracking-tight"><Palette className="h-4 w-4 text-muted-foreground" />Identidad de tu carta</h2>
        <p className="mb-5 mt-1 text-[13px] leading-relaxed text-muted-foreground">Cuatro colores alcanzan: marca, acento, fondo y texto.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {COLORS.map((c) => (
            <label key={c.key} htmlFor={`color-${c.key}`} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/60 focus-within:ring-2 focus-within:ring-[#6D28D9]">
              <input id={`color-${c.key}`} type="color" value={form[c.key]} onChange={color(c.key)} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1" aria-label={`${c.label}: ${form[c.key]}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.hint}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] uppercase tabular-nums text-muted-foreground">{form[c.key]}</span>
            </label>
          ))}
        </div>

        {/* Portada + logo con subida al hover + recorte */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            className="group relative block h-28 w-full cursor-pointer overflow-hidden bg-[#0A2540]"
            aria-label="Subir portada"
          >
            {form.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.bannerUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-white/40">
                <ImagePlus className="h-7 w-7" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ImagePlus className="h-4 w-4" />
              {uploading === "banner" ? "Subiendo…" : form.bannerUrl ? "Cambiar portada" : "Subir portada"}
            </span>
          </button>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              className="group relative -mt-9 shrink-0 cursor-pointer overflow-hidden rounded-2xl ring-4 ring-card"
              aria-label="Subir logo"
            >
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="" className="h-16 w-16 object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center bg-[#6D28D9] text-2xl font-extrabold text-white">
                  {logoInitial}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ImagePlus className="h-5 w-5" />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Restaurante</p>
              <p className="truncate text-base font-bold">{displayName || "Tu restaurante"}</p>
            </div>
          </div>
          <input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onPickFile("banner", e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { onPickFile("logo", e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="ap-rest-name" className="text-sm font-medium">Nombre del restaurante</label>
            <input
              id="ap-rest-name"
              type="text"
              value={form.restaurantName}
              onChange={(e) => setForm((f) => ({ ...f, restaurantName: e.target.value.slice(0, 120) }))}
              placeholder={commercialNameFallback || "Ej: La Parrilla de Juan"}
              maxLength={120}
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
            />
            {commercialNameFallback ? (
              <p className="mt-1 text-[11px] text-muted-foreground">Nombre real: {commercialNameFallback}. Si lo cambiás en Mi negocio, el slug y el menú se actualizan.</p>
            ) : null}
          </div>
        </div>

        {cropSrc ? (
          <ImageCropDialog
            open
            onOpenChange={(v) => { if (!v) closeCrop(); }}
            image={cropSrc}
            aspect={cropKind === "logo" ? 1 : 3}
            round={cropKind === "logo"}
            title={cropKind === "logo" ? "Recortar logo" : "Recortar portada"}
            hint={cropKind === "logo" ? "Cuadrado, se ve en el header de la carta." : "Panorámica 1200×400 aprox."}
            output={cropKind === "logo" ? { width: 512, height: 512 } : { width: 1200, height: 400 }}
            format={cropKind === "logo" ? "original" : "webp"}
            sourceType={cropMime || undefined}
            onDone={onCropDone}
          />
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {([["titleFont", "Títulos"], ["bodyFont", "Textos"]] as const).map(([key, label]) => (
            <fieldset key={key}>
              <legend className="text-sm font-medium">{label}</legend>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {FONTS.map((f) => {
                  const active = form[key] === f.id;
                  return (
                    <button key={f.id} type="button" onClick={() => setForm((p) => ({ ...p, [key]: f.id }))} aria-pressed={active} className={`rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${active ? "border-[#0A2540] bg-[#0A2540] text-white" : "border-border hover:bg-muted"}`}>
                      <span className={`block text-sm font-bold ${f.id === "serif" ? "font-serif" : f.id === "mono" ? "font-mono" : ""}`}>{f.demo}</span>
                      <span className={`mt-0.5 flex items-center gap-1 text-[11px] ${active ? "text-white/70" : "text-muted-foreground"}`}>{active && <Check className="h-3 w-3" />}{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-6 divide-y divide-border rounded-xl border border-border">
          {([["showPrices", "Precios a la vista", "Sin precios la carta es solo vidriera"], ["showImages", "Fotos de platos", "Suben el antojo, pesan más en móvil"], ["showDescriptions", "Descripciones", "Ingredientes que venden"]] as const).map(([k, label, hint]) => (
            <label key={k} htmlFor={`sw-${k}`} className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
              <span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{hint}</span></span>
              <Switch id={`sw-${k}`} checked={form[k]} onCheckedChange={(v) => setForm((f) => ({ ...f, [k]: v }))} />
            </label>
          ))}
        </div>

        <Button onClick={onSave} disabled={saving} className="mt-5 min-h-10 w-full bg-[#0A2540] hover:bg-[#0A2540]/90 focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2 sm:w-auto sm:px-8">
          {saving ? "Aplicando..." : "Aplicar a mi carta"}
        </Button>
        </section>
      }
      preview={
        <CartaPhonePreview
          slug={slug}
          appearance={form}
          categories={categories}
          products={products}
          currency={currency}
          hours={hours}
          restaurantName={form.restaurantName}
          schedule={schedule}
          reloadSignal={previewTick}
          draft={draft}
        />
      }
    />
  );
}
