"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { usernameSchema } from "@/lib/validations/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

export function SettingsTab({ state, baseUrl = "miseby.com" }: { state: State; baseUrl?: string }) {
  const [username, setUsername] = useState(state.page.username);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = `${baseUrl}/${state.page.username}`;

  const saveUsername = async () => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nombre inválido");
      return;
    }
    setError("");
    setSaving(true);
    await state.saveUsername(parsed.data);
    setSaving(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <Field data-invalid={Boolean(error)}>
        <FieldLabel htmlFor="username">Tu dirección</FieldLabel>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{baseUrl}/</span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl"
          />
          <Button
            onClick={saveUsername}
            disabled={saving}
            variant="outline"
            className="shrink-0 rounded-xl"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
          </Button>
        </div>
        {error && <FieldError errors={[{ message: error }]} />}
      </Field>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium">Publicar página</p>
          <p className="text-xs text-muted-foreground">
            {state.page.published ? "Tu página está online." : "Sólo vos podés verla."}
          </p>
        </div>
        <Switch
          checked={state.page.published}
          onCheckedChange={(v) => state.setPublished(v)}
          aria-label="Publicar página"
        />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3">
        <span className="flex-1 truncate text-sm">{publicUrl}</span>
        <Button onClick={copy} variant="ghost" size="sm" className="gap-1">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}
