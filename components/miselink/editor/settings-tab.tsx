"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChangePasswordForm } from "@/components/control/account/change-password-form";
import { usernameSchema } from "@/lib/validations/miselink";
import { checkUsernameAction } from "@/lib/actions/miselink";
import type { useMiseLinkState } from "@/hooks/use-miselink-state";

type State = ReturnType<typeof useMiseLinkState>;

type Availability =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "taken" }
  | { status: "error"; message: string };

export function SettingsTab({ state, baseUrl = "miseby.com" }: { state: State; baseUrl?: string }) {
  const [username, setUsername] = useState(state.page.username);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [availability, setAvailability] = useState<Availability>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const publicUrl = `${baseUrl}/${state.page.username}`;
  const trimmed = username.trim().toLowerCase();
  const unchanged = trimmed === state.page.username;

  useEffect(() => {
    clearTimeout(timer.current);
    if (unchanged) {
      setAvailability({ status: "idle" });
      return;
    }
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setAvailability({
        status: "error",
        message: parsed.error.issues[0]?.message ?? "Nombre inválido",
      });
      return;
    }
    setAvailability({ status: "checking" });
    timer.current = setTimeout(async () => {
      const res = await checkUsernameAction(parsed.data);
      if (!res.ok) {
        setAvailability({ status: "error", message: res.error });
        return;
      }
      setAvailability({ status: res.available ? "ok" : "taken" });
    }, 400);
    return () => clearTimeout(timer.current);
  }, [username, unchanged]);

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
    setAvailability({ status: "idle" });
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

  const canSave =
    !unchanged && !saving && (availability.status === "ok" || availability.status === "idle");

  return (
    <Tabs defaultValue="cuenta" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
        <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
      </TabsList>

      <TabsContent value="cuenta" className="space-y-4 pt-4">
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="username">Nombre de usuario</FieldLabel>
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
              disabled={!canSave}
              variant="outline"
              className="shrink-0 rounded-xl"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
          <AvailabilityHint availability={availability} />
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
      </TabsContent>

      <TabsContent value="seguridad" className="pt-4">
        <ChangePasswordForm />
      </TabsContent>
    </Tabs>
  );
}

function AvailabilityHint({ availability }: { availability: Availability }) {
  if (availability.status === "idle") return null;
  if (availability.status === "checking") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidad…
      </p>
    );
  }
  if (availability.status === "ok") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600">
        <Check className="h-3 w-3" /> Disponible
      </p>
    );
  }
  if (availability.status === "taken") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-red-600">
        <X className="h-3 w-3" /> Ese nombre ya está en uso
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600">
      <X className="h-3 w-3" /> {availability.message}
    </p>
  );
}
