"use client";

import { CircleHelp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FOCUS_EXAMPLES, FOCUS_LIMIT, TONE_EXAMPLES, TONE_LIMIT } from "./ia-helpers";

type Props = {
  focus: string;
  tone: string;
  onFocus: (v: string) => void;
  onTone: (v: string) => void;
};

function Counter({ n, max }: { n: number; max: number }) {
  const near = n > max * 0.9;
  return (
    <span aria-live="polite" className={`shrink-0 text-[11px] tabular-nums ${near ? "font-semibold text-amber-600" : "text-muted-foreground"}`}>
      {n}/{max}
    </span>
  );
}

function ExampleChips({ items, onPick, label }: { items: readonly string[]; onPick: (v: string) => void; label: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {items.map((ex) => (
        <button
          key={ex}
          type="button"
          onClick={() => onPick(ex)}
          title="Usar este ejemplo"
          className="cursor-pointer rounded-full border border-dashed border-border bg-background px-2.5 py-1 text-[11px] leading-snug text-muted-foreground transition-colors hover:border-[#6D28D9]/50 hover:bg-[#6D28D9]/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}

export function IaFields({ focus, tone, onFocus, onTone }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Personalizá a tu mesero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Label htmlFor="ia-foco">Qué querés impulsar hoy</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Ayuda: qué impulsar" className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]">
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-55 text-xs">
                    Contale qué platos querés mover hoy. Si lo dejás vacío, recomienda todo el menú.
                  </TooltipContent>
                </Tooltip>
              </span>
              <Counter n={focus.length} max={FOCUS_LIMIT} />
            </div>
            <Textarea
              id="ia-foco"
              value={focus}
              onChange={(e) => onFocus(e.target.value)}
              rows={3}
              maxLength={FOCUS_LIMIT}
              placeholder="Ej: hoy quiero mover el menú del día ($9000) y los postres de la casa"
              aria-describedby="ia-foco-hint"
              className="mt-1.5 resize-none"
            />
            <p id="ia-foco-hint" className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              {focus.trim() ? "Bien: cuanto más concreto, mejor recomienda." : "Vacío = recomienda todo el menú por igual."}
            </p>
            <ExampleChips items={FOCUS_EXAMPLES} onPick={onFocus} label="Ejemplos para qué impulsar" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Label htmlFor="ia-tono">Cómo habla tu mesero</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Ayuda: cómo habla" className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9]">
                      <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-55 text-xs">
                    Definí el tono: cercano, formal, con humor… Siempre responde en español y breve.
                  </TooltipContent>
                </Tooltip>
              </span>
              <Counter n={tone.length} max={TONE_LIMIT} />
            </div>
            <Textarea
              id="ia-tono"
              value={tone}
              onChange={(e) => onTone(e.target.value)}
              rows={3}
              maxLength={TONE_LIMIT}
              placeholder="Ej: habla en español rioplatense, familiar, respuestas de 2 líneas máximo"
              aria-describedby="ia-tono-hint"
              className="mt-1.5 resize-none"
            />
            <p id="ia-tono-hint" className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
              {tone.trim() ? "Bien: ese tono se va a notar en cada respuesta." : "Vacío = tono amable y breve por defecto."}
            </p>
            <ExampleChips items={TONE_EXAMPLES} onPick={onTone} label="Ejemplos de tono" />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
