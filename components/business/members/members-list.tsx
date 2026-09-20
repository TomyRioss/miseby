"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orgRoleLabel } from "./role-labels";
import type { ActorRole, MembersActionResult, OrgInvitationItem, OrgMemberItem } from "./types";

function formatExpiry(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export function MembersList({
  actorRole,
  orgId,
  initialMembers,
  initialInvitations,
  onChangeRole,
  onRemove,
  onCancelInvitation,
}: {
  actorRole: ActorRole;
  orgId: string;
  initialMembers: OrgMemberItem[];
  initialInvitations: OrgInvitationItem[];
  onChangeRole: (
    orgId: string,
    memberUserId: string,
    role: "business_admin" | "business_member"
  ) => Promise<MembersActionResult>;
  onRemove: (orgId: string, memberUserId: string) => Promise<MembersActionResult>;
  onCancelInvitation: (orgId: string, invitationId: string) => Promise<MembersActionResult>;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isOwner = actorRole === "business_owner";

  const canRemove = (m: OrgMemberItem): boolean => {
    if (m.isSelf) return false;
    if (m.role === "business_owner") return false;
    if (isOwner) return true;
    // TOM-193: admin solo elimina/desactiva members.
    return m.role === "business_member";
  };

  // Solo owner cambia roles, y solo entre Admin ↔ Miembro (el backend no
  // permite tocar al propietario ni promover a owner por esta vía).
  const canChangeRole = (m: OrgMemberItem): boolean =>
    isOwner && !m.isSelf && m.role !== "business_owner";

  const handleRoleChange = async (m: OrgMemberItem, role: "business_admin" | "business_member") => {
    if (m.role === role) return;
    setError(null);
    setBusyId(m.id);
    try {
      const result = await onChangeRole(orgId, m.userId, role);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)));
    } catch (err) {
      console.error("[change role]", err);
      setError("No pudimos cambiar el rol.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (m: OrgMemberItem) => {
    const label = m.user.name ?? m.user.email;
    if (!window.confirm(`¿Quitar a ${label} del negocio? Quedará desactivado.`)) return;
    setError(null);
    setBusyId(m.id);
    try {
      const result = await onRemove(orgId, m.userId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      console.error("[remove member]", err);
      setError("No pudimos quitar al miembro.");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelInvitation = async (inv: OrgInvitationItem) => {
    if (!window.confirm(`¿Cancelar la invitación a ${inv.email}?`)) return;
    setError(null);
    setBusyId(inv.id);
    try {
      const result = await onCancelInvitation(orgId, inv.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setInvitations((prev) => prev.filter((x) => x.id !== inv.id));
    } catch (err) {
      console.error("[cancel invitation]", err);
      setError("No pudimos cancelar la invitación.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold">Miembros ({members.length})</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Quiénes tienen acceso a tu negocio y con qué rol.</p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay miembros.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.user.name ?? m.user.email}
                    {m.isSelf && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">vos</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={m.status === "active" ? "default" : "secondary"}>
                    {m.status === "active" ? "Activo" : m.status}
                  </Badge>
                  {canChangeRole(m) ? (
                    <Select
                      value={m.role}
                      onValueChange={(role) =>
                        handleRoleChange(m, role as "business_admin" | "business_member")
                      }
                      disabled={busyId === m.id}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue>{orgRoleLabel(m.role)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business_admin">Admin</SelectItem>
                        <SelectItem value="business_member">Miembro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{orgRoleLabel(m.role)}</Badge>
                  )}
                  {canRemove(m) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={busyId === m.id}
                      onClick={() => handleRemove(m)}
                    >
                      {busyId === m.id ? "…" : "Quitar"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {!isOwner && (
          <p className="mt-4 text-xs text-muted-foreground">
            Solo el Administrador puede cambiar roles. Como Admin podés invitar miembros y quitar miembros.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold">Invitaciones pendientes ({invitations.length})</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Invitaciones enviadas que todavía no fueron aceptadas.</p>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay invitaciones pendientes.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">Vence: {formatExpiry(inv.expiresAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{orgRoleLabel(inv.role)}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={busyId === inv.id}
                    onClick={() => handleCancelInvitation(inv)}
                  >
                    {busyId === inv.id ? "…" : "Cancelar"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
