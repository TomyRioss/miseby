"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileNameAction } from "@/lib/actions/account";
import type { AccountActionResult } from "./types";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Ingresá tu nombre (mínimo 2 caracteres).");
      return;
    }
    setBusy(true);
    try {
      const result = (await updateProfileNameAction({
        name: trimmed,
      })) as AccountActionResult;
      if (!result.ok) {
        toast.error(result.error ?? "No pudimos actualizar tu nombre.");
        return;
      }
      toast.success("Nombre actualizado.");
      router.refresh();
    } catch (err) {
      console.error("[profile name]", err);
      toast.error("No pudimos actualizar tu nombre. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="font-display font-semibold">Perfil</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Así aparece tu nombre en el panel.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-name">Nombre</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="name"
          placeholder="Tu nombre"
        />
      </div>
      <Button type="submit" disabled={busy} className="mt-4 cursor-pointer">
        {busy ? "Guardando…" : "Guardar nombre"}
      </Button>
    </form>
  );
}
