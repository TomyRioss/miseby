"use client";

import { useMemo, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { saveIaAction } from "@/lib/actions/restaurant";
import type { RestaurantData } from "@/lib/restaurant-theme";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const QUICK = ["¿Qué me recomendás liviano?", "¿Qué postre pido?", "Somos 2, ¿qué pedimos?"];

export function IaConfig({ initial, menuSummary }: { initial: NonNullable<RestaurantData["ia"]>; menuSummary: string }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [chat, setChat] = useState<{ role: "user" | "ia"; text: string }[]>([]);
  const [msg, setMsg] = useState("");

  const prompt = useMemo(
    () => `Mesero IA · solo platos reales (${menuSummary}). Foco: ${form.whatToRecommend?.trim() || "todo el menú"}. Tono: ${form.customInstructions?.trim() || "amable, español, breve"}.`,
    [menuSummary, form]
  );

  async function save() {
    setSaving(true);
    try {
      const res = await saveIaAction(form);
      if (!res.ok) throw new Error(res.error);
      toast.success(form.isActive ? "Mesero IA activo en tu carta." : "Cambios guardados (IA en pausa).");
    } catch (e) {
      console.error("[mise-ia]", e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function send(text?: string) {
    const value = (text ?? msg).trim();
    if (!value) return;
    if (!form.isActive) return toast.error("Activá el mesero primero para probar.");
    setChat((c) => [...c, { role: "user", text: value }, { role: "ia", text: fakeReply(value, menuSummary, form.whatToRecommend ?? "") }]);
    setMsg("");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <section aria-labelledby="ia-conf" className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D28D9] text-white"><Sparkles className="h-4 w-4" /></span>
          <div>
            <h2 id="ia-conf" className="mt-1 text-base font-semibold tracking-tight">Mesero IA</h2>
            <p className="text-xs text-muted-foreground">Recomienda solo lo que sí vendés.</p>
          </div>
          <Badge variant={form.isActive ? "default" : "secondary"} className={`ml-auto ${form.isActive ? "bg-emerald-600" : ""}`}>{form.isActive ? "Activo" : "Pausado"}</Badge>
        </div>
        <label htmlFor="ia-on" className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3">
          <span className="text-sm font-medium">Responder en mi carta</span>
          <Switch id="ia-on" checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
        </label>
        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-baseline justify-between"><Label htmlFor="ia-foco">Qué impulsa hoy</Label><span className="text-[11px] tabular-nums text-muted-foreground">{(form.whatToRecommend ?? "").length}/600</span></div>
            <Textarea id="ia-foco" value={form.whatToRecommend ?? ""} onChange={(e) => setForm((f) => ({ ...f, whatToRecommend: e.target.value }))} rows={3} maxLength={600} placeholder="Ej: menú del día y postres de la casa" className="mt-1.5 resize-none" />
          </div>
          <div>
            <div className="flex items-baseline justify-between"><Label htmlFor="ia-tono">Cómo habla</Label><span className="text-[11px] tabular-nums text-muted-foreground">{(form.customInstructions ?? "").length}/1000</span></div>
            <Textarea id="ia-tono" value={form.customInstructions ?? ""} onChange={(e) => setForm((f) => ({ ...f, customInstructions: e.target.value }))} rows={3} maxLength={1000} placeholder="Ej: español, familiar, respuestas de 2 líneas" className="mt-1.5 resize-none" />
          </div>
          <Button onClick={save} disabled={saving} className="min-h-10 w-full bg-[#0A2540] hover:bg-[#0A2540]/90">{saving ? "Guardando..." : "Guardar mesero"}</Button>
        </div>
        <details className="mt-4 rounded-xl bg-muted px-4 py-3">
          <summary className="cursor-pointer text-xs font-semibold">Ver instrucción exacta</summary>
          <p className="mt-2 break-words font-mono text-[11px] leading-relaxed text-muted-foreground">{prompt}</p>
        </details>
      </section>

      <section aria-labelledby="ia-chat" className="flex min-h-105 flex-col rounded-2xl border border-border bg-card p-6 lg:col-span-3">
        <h2 id="ia-chat" className="mt-1 text-base font-semibold tracking-tight">Probalo como un cliente</h2>
        <p className="mb-3 mt-1 text-[13px] text-muted-foreground">Si inventa un plato, ajustá el foco arriba.</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => send(q)} className="cursor-pointer min-h-8 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]">“{q}”</button>
          ))}
        </div>
        <div aria-live="polite" className="mt-3 max-h-80 min-h-48 flex-1 space-y-2 overflow-y-auto rounded-xl bg-muted p-3">
          {chat.length === 0 && <p className="px-1 py-6 text-center text-[13px] text-muted-foreground">Tocá una pregunta o escribí la tuya.<br />El mesero responde con tu carta real.</p>}
          {chat.map((m, i) => (
            <p key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "user" ? "ml-auto bg-[#0A2540] text-white" : "border border-border bg-card"}`}>{m.text}</p>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={form.isActive ? "Escribí como cliente..." : "Activá el mesero para probar..."} disabled={!form.isActive} aria-label="Mensaje de prueba" maxLength={300} className="min-h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] disabled:opacity-50" />
          <Button onClick={() => send()} disabled={!form.isActive} aria-label="Enviar pregunta" className="min-h-10 bg-[#0A2540] hover:bg-[#0A2540]/90"><Send className="h-4 w-4" /></Button>
        </div>
      </section>
    </div>
  );
}

function fakeReply(q: string, menu: string, focus: string) {
  const s = q.toLowerCase();
  const dishes = menu || "nuestros destacados";
  if (s.includes("liviano") || s.includes("light") || s.includes("ensalada") || s.includes("dieta")) return `Liviano y rico: ${dishes}.${focus ? ` Hoy impulso: ${focus}.` : ""} ¿Te armo algo sin fritura?`;
  if (s.includes("precio") || s.includes("barato") || s.includes("promo") || s.includes("2")) return `Para 2, lo que más conviene: ${dishes}. Pedí variado y comparten.`;
  if (s.includes("postre") || s.includes("dulce")) return `De postre, lo de la casa: mirá la sección Postres. ${dishes}.`;
  return `Con gusto. Hoy sale mucho: ${dishes}. ¿Antojo contundente o liviano?`;
}
