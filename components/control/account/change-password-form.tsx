"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/lib/actions/auth";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    setBusy(true);
    try {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess("Contraseña actualizada exitosamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Error al actualizar contraseña");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Contraseña actual</Label>
        <PasswordInput required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Nueva contraseña</Label>
        <PasswordInput required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Confirmar nueva contraseña</Label>
        <PasswordInput required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>
      )}
      <Button type="submit" disabled={busy} className="bg-[#075296] text-white hover:bg-[#0E88E2]">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Actualizar contraseña
      </Button>
    </form>
  );
}
