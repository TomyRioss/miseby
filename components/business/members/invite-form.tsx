"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActorRole, MembersActionResult } from "./types";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "business_admin", label: "Admin" },
  { value: "business_member", label: "Miembro" },
];

export function InviteForm({
  actorRole,
  orgId,
  onInvite,
  onInvited,
}: {
  actorRole: ActorRole;
  orgId: string;
  onInvite: (input: { orgId: string; email: string; role: "business_admin" | "business_member" }) => Promise<MembersActionResult>;
  onInvited?: () => void;
}) {
  // TOM-193: admin solo puede invitar con rol Miembro.
  const options =
    actorRole === "business_owner" ? ROLE_OPTIONS : ROLE_OPTIONS.filter((o) => o.value === "business_member");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"business_admin" | "business_member">(
    actorRole === "business_owner" ? "business_member" : "business_member"
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Ingresá un email.");
      return;
    }
    setBusy(true);
    try {
      const result = await onInvite({ orgId, email: trimmed, role });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Invitación enviada a ${trimmed}.`);
      setEmail("");
      onInvited?.();
    } catch (err) {
      console.error("[invite member]", err);
      setError("No pudimos enviar la invitación.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display font-semibold">Invitar miembro</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        {actorRole === "business_owner"
          ? "Invitá admins o miembros a tu negocio."
          : "Podés invitar nuevos miembros a tu negocio."}
      </p>
      <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="equipo@tunegocio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-role">Rol</Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "business_admin" | "business_member")}
            disabled={busy}
          >
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Enviando…" : "Invitar"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
    </form>
  );
}
