"use client";

import { Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function IaStatusCard({ isActive, onToggle }: { isActive: boolean; onToggle: (v: boolean) => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-4">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6D28D9] text-white shadow-sm"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6D28D9]">Mesero IA</p>
          <h2 id="ia-conf" className="mt-0.5 text-lg font-semibold leading-tight tracking-tight">
            Tu mesero responde en la carta
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-muted-foreground">Recomienda solo lo que sí vendés.</p>
        </div>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={`ml-1 inline-flex shrink-0 items-center gap-1.5 ${isActive ? "bg-emerald-600 hover:bg-emerald-600/90" : ""}`}
          aria-live="polite"
        >
          {isActive && <span aria-hidden className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" /></span>}
          <Crown aria-hidden className="h-3 w-3" />
          {isActive ? "Activo" : "Pausado"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <label
          htmlFor="ia-on"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 transition-colors hover:bg-muted/70 has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-[#6D28D9]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Responder en mi carta</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
              {isActive ? "Tus clientes ya ven las recomendaciones." : "Activalo y tus clientes ven las recomendaciones."}
            </span>
          </span>
          <Switch id="ia-on" checked={isActive} onCheckedChange={onToggle} aria-describedby="ia-on-hint" className="shrink-0 cursor-pointer" />
        </label>
        <p id="ia-on-hint" className="mt-2 px-1 text-[11px] leading-snug text-muted-foreground">
          Podés pausarlo cuando quieras sin perder lo que escribiste abajo.
        </p>
      </CardContent>
    </Card>
  );
}
