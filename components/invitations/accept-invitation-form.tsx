"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { acceptInvitationAction } from "@/lib/actions/invitations";

export function AcceptInvitationForm({
  token,
  userExists,
  organizationName,
  role,
}: {
  token: string;
  userExists: boolean;
  organizationName: string;
  role: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userExists && password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!userExists && password.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const result = await acceptInvitationAction({ token, name: name || undefined, password: password || undefined });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      console.error(err);
      setError("No fue posible aceptar la invitación.");
    } finally {
      setBusy(false);
    }
  };

  const inp =
    "rounded-xl border border-input px-4 py-3 text-sm outline-none transition focus:border-[#0E88E2] focus:ring-2 focus:ring-[#1FD0FF]/40 bg-white";

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h1 className="font-display mb-2 text-xl font-semibold">¡Invitación aceptada!</h1>
        <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h1 className="font-display mb-1 text-2xl font-semibold">
        {userExists ? "Aceptar invitación" : "Crear tu cuenta"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Fuiste invitado a <strong>{organizationName}</strong> como{" "}
        {role === "business_owner" ? "Administrador" : "Miembro"}.
      </p>

      <form onSubmit={submit} className="space-y-4">
        {!userExists && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Tu nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inp} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{userExists ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!userExists}
            className={inp}
          />
        </div>

        {!userExists && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Confirmar contraseña</label>
            <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={inp} />
          </div>
        )}

        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <Button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {userExists ? "Aceptar invitación" : "Crear cuenta y acceder"}
        </Button>
      </form>
    </div>
  );
}
