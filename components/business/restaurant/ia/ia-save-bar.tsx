"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  saving: boolean;
  dirty: boolean;
  savedLabel: string | null;
  error: string | null;
  prompt: string;
  onSave: () => void;
};

export function IaSaveBar({ saving, dirty, savedLabel, error, prompt, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Instrucción copiada.");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("[mise-ia copy]", e);
      toast.error("No se pudo copiar.");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="lg:sticky lg:bottom-4">
          <Button
            onClick={onSave}
            disabled={saving || !dirty}
            className="min-h-11 w-full cursor-pointer bg-[#0A2540] text-[15px] font-semibold hover:bg-[#0A2540]/90 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Guardando…</span>
            ) : dirty ? (
              "Guardar mesero"
            ) : savedLabel ? (
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Guardado</span>
            ) : (
              "Guardar mesero"
            )}
          </Button>
          <p aria-live="polite" className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            {saving ? (
              "Guardando tus cambios…"
            ) : dirty ? (
              <><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />Tenés cambios sin guardar</>
            ) : savedLabel ? (
              <><Check aria-hidden className="h-3 w-3 text-emerald-600" />Guardado {savedLabel}</>
            ) : (
              "Los cambios se ven en tu carta al guardar."
            )}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" role="alert">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl bg-muted/60">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] rounded-xl"
          >
            Ver instrucción exacta
            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="px-4 pb-3">
              <p className="break-words font-mono text-[11px] leading-relaxed text-muted-foreground">{prompt}</p>
              <Button variant="ghost" size="sm" onClick={copy} className="mt-2 h-8 cursor-pointer px-2 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
