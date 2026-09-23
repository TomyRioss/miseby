"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { updateEmailAction } from "@/lib/actions/account";
import type { AccountActionResult } from "./types";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Ingresá el nuevo email.");
      return;
    }
    if (!currentPassword) {
      toast.error("Ingresá tu contraseña actual para confirmar.");
      return;
    }
    setBusy(true);
    try {
      const result = (await updateEmailAction({
        email: trimmed,
        currentPassword,
      })) as AccountActionResult;
      if (!result.ok) {
        toast.error(result.error ?? "No pudimos actualizar tu email.");
        return;
      }
      toast.success("Email actualizado.");
      if (result.requireRelogin) {
        try {
          await signOut({ redirect: false });
        } catch (err) {
          console.error("[email relogin signout]", err);
        }
        router.replace("/login");
        return;
      }
      setEmail("");
      setCurrentPassword("");
      router.refresh();
    } catch (err) {
      console.error("[account email]", err);
      toast.error("No pudimos actualizar tu email. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="font-display font-semibold">Email</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Actual: <span className="font-medium break-all">{currentEmail}</span>.
        Te pedimos tu contraseña actual para confirmar el cambio.
      </p>
      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-new-email">Nuevo email</Label>
          <Input
            id="account-new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            placeholder="nombre@mail.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-email-password">Contraseña actual</Label>
          <PasswordInput
            id="account-email-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="mt-4 cursor-pointer">
        {busy ? "Guardando…" : "Cambiar email"}
      </Button>
    </form>
  );
}
