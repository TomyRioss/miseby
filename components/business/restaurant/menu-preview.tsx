"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { setMenuPublishedAction } from "@/lib/actions/restaurant";
import type { RestaurantData } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuEditorLayout } from "./menu-editor-layout";
import { CartaPhonePreview } from "./carta-phone-preview";

export function MenuPreview({ data, currency, slug }: { data: RestaurantData; currency?: string | null; slug: string }) {
  const [published, setPublished] = useState(data.menuPublished === true);
  const [saving, setSaving] = useState(false);
  const cats = [...(data.categories ?? [])].sort((a, b) => a.order - b.order);
  const products = data.products ?? [];
  const available = products.filter((p) => p.available);
  const ap = data.appearance!;

  const checks = [
    { ok: cats.length > 0, label: cats.length > 0 ? `${cats.length} secciones` : "Creá 1 sección" },
    { ok: available.length > 0, label: available.length > 0 ? `${available.length} platos visibles` : "Activá 1 plato" },
    { ok: available.some((p) => p.price > 0), label: "Precios cargados" },
  ];
  const ready = checks.every((c) => c.ok);

  async function toggle() {
    if (!published && !ready) return toast.error("Completá secciones, platos y precios antes de publicar.");
    setSaving(true);
    try {
      const res = await setMenuPublishedAction(!published);
      if (!res.ok) throw new Error(res.error);
      setPublished(!published);
      toast.success(!published ? "Tu carta ya está en línea." : "Carta en pausa. Nadie la ve.");
    } catch (e) {
      console.error("[menu]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/menu/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Enlace copiado. Pegalo en tu Instagram."), () => toast.error("No se pudo copiar."));
  }

  return (
    <MenuEditorLayout
      left={
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <h2 id="menu-estado" className="mt-1 text-base font-semibold tracking-tight">Estado de tu carta</h2>
            <Badge variant={published ? "default" : "secondary"} className={published ? "bg-emerald-600" : ""}>{published ? "En línea" : "Borrador"}</Badge>
          </div>
          <ul className="mt-4 space-y-2">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-[13px]">
                {c.ok
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Listo" />
                  : <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" aria-label="Falta" />}
                <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button onClick={toggle} disabled={saving} className="min-h-10 flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90 focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2">
              {saving ? "Cambiando..." : published ? "Pausar carta" : ready ? "Publicar carta" : "Te falta para publicar"}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-semibold">Compartir</p>
          <p className="mt-1 font-mono text-xs break-all text-muted-foreground">/menu/{slug}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={copyLink} className="min-h-10 flex-1"><Copy className="h-4 w-4" />Copiar enlace</Button>
            <Button variant="outline" asChild className="min-h-10"><a className="cursor-pointer" href={`/menu/${slug}`} target="_blank" rel="noreferrer" aria-label="Abrir carta pública"><ExternalLink className="h-4 w-4" /></a></Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">QR y link para mesas: el QR sale de este mismo enlace.</p>
          </div>
        </div>
      }
      preview={
        <CartaPhonePreview
          slug={slug}
          appearance={ap}
          categories={cats}
          products={products}
          currency={currency}
          hours={data.hours}
        />
      }
    />
  );
}
