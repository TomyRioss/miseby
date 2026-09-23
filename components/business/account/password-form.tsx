"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { changePasswordAction } from "@/lib/actions/auth";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Ingresá tu contraseña actual.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("La nueva contraseña necesita mínimo 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (!result.ok) {
        toast.error(result.error ?? "No pudimos cambiar tu contraseña.");
        return;
      }
      toast.success("Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error("[account password]", err);
      toast.error("No pudimos cambiar tu contraseña. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="font-display font-semibold">Contraseña</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Elegí una contraseña nueva de al menos 8 caracteres.
      </p>
      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-current-password">Contraseña actual</Label>
          <PasswordInput
            id="account-current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-new-password">Contraseña nueva</Label>
          <PasswordInput
            id="account-new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="mt-4 cursor-pointer">
        {busy ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
