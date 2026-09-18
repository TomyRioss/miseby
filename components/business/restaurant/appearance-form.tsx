"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { saveAppearanceAction } from "@/lib/actions/restaurant";
import type { RestaurantAppearance, RestaurantCategory, RestaurantProduct } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MenuEditorLayout } from "./menu-editor-layout";
import { CartaPhonePreview } from "./carta-phone-preview";

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
}: {
  initial: RestaurantAppearance;
  categories?: RestaurantCategory[];
  products?: RestaurantProduct[];
  currency?: string | null;
  slug?: string;
  hours?: string;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  function color(k: "primary" | "secondary" | "background" | "text") {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const res = await saveAppearanceAction(form);
      if (!res.ok) throw new Error(res.error);
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

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {([["titleFont", "Títulos"], ["bodyFont", "Textos"]] as const).map(([key, label]) => (
            <fieldset key={key}>
              <legend className="text-sm font-medium">{label}</legend>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {FONTS.map((f) => {
                  const active = form[key] === f.id;
                  return (
                    <button key={f.id} type="button" onClick={() => setForm((p) => ({ ...p, [key]: f.id }))} aria-pressed={active} className={`cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] ${active ? "border-[#0A2540] bg-[#0A2540] text-white" : "border-border hover:bg-muted"}`}>
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
        />
      }
    />
  );
}
