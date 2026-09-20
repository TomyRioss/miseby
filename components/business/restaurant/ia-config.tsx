"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { saveIaAction } from "@/lib/actions/restaurant";
import type { RestaurantData } from "@/lib/restaurant-theme";
import { IaChatPanel } from "./ia/ia-chat-panel";
import { IaFields } from "./ia/ia-fields";
import { buildPrompt, timeAgo } from "./ia/ia-helpers";
import { IaSaveBar } from "./ia/ia-save-bar";
import { IaStatusCard } from "./ia/ia-status-card";

type IaForm = NonNullable<RestaurantData["ia"]>;

export function IaConfig({ initial, menuSummary }: { initial: IaForm; menuSummary: string }) {
  const [form, setForm] = useState<IaForm>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const prompt = useMemo(
    () => buildPrompt(menuSummary, form.whatToRecommend ?? "", form.customInstructions ?? ""),
    [menuSummary, form]
  );

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await saveIaAction(form);
      if (!res.ok) throw new Error(res.error);
      setSavedAt(Date.now());
      toast.success(form.isActive ? "Mesero IA activo en tu carta." : "Cambios guardados (IA en pausa).");
    } catch (e) {
      console.error("[mise-ia]", e);
      const msg = e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-5">
      <div className="min-w-0 space-y-4 lg:col-span-2">
        <IaStatusCard isActive={form.isActive} onToggle={(v) => setForm((f) => ({ ...f, isActive: v }))} />
        <IaFields
          focus={form.whatToRecommend ?? ""}
          tone={form.customInstructions ?? ""}
          onFocus={(v) => setForm((f) => ({ ...f, whatToRecommend: v }))}
          onTone={(v) => setForm((f) => ({ ...f, customInstructions: v }))}
        />
      </div>
      <div className="min-w-0 space-y-4 lg:col-span-3 lg:sticky lg:top-4">
        <IaChatPanel isActive={form.isActive} menuSummary={menuSummary} focus={form.whatToRecommend ?? ""} />
        <IaSaveBar saving={saving} dirty={dirty} savedLabel={timeAgo(savedAt)} error={error} prompt={prompt} onSave={save} />
      </div>
    </div>
  );
}
