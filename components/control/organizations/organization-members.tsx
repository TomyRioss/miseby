"use client";

import { useState } from "react";
import { Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/control/confirm-button";
import {
  updateOrganizationMemberAction,
  removeOrganizationMemberAction,
  inviteOrganizationMemberAction,
} from "@/lib/actions/organization-members";
import type { OrganizationMember, OrganizationMemberRole } from "@prisma/client";

type MemberWithUser = OrganizationMember & {
  user: { id: string; name: string | null; email: string };
};

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  business_owner: "Propietario",
  business_admin: "Administrador",
  business_member: "Miembro",
};

const EDITABLE_ROLES: OrganizationMemberRole[] = ["business_admin", "business_member"];

export function OrganizationMembers({
  organizationId,
  members,
}: {
  organizationId: string;
  members: MemberWithUser[];
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationMemberRole>("business_member");

  const changeRole = async (memberId: string, next: OrganizationMemberRole) => {
    setBusyId(memberId);
    try {
      const result = await updateOrganizationMemberAction(memberId, { role: next });
      if (!result.ok) toast.error(result.error);
      else toast.success("Rol actualizado");
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar rol");
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (memberId: string, status: "active" | "inactive") => {
    setBusyId(memberId);
    try {
      const result = await updateOrganizationMemberAction(memberId, { status });
      if (!result.ok) toast.error(result.error);
      else toast.success(status === "active" ? "Miembro reactivado" : "Miembro suspendido");
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado del miembro");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (memberId: string) => {
    setBusyId(memberId);
    try {
      const result = await removeOrganizationMemberAction(memberId);
      if (!result.ok) toast.error(result.error);
      else toast.success("Miembro dado de baja");
    } catch (err) {
      console.error(err);
      toast.error("Error al dar de baja");
    } finally {
      setBusyId(null);
    }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteBusy(true);
    try {
      const result = await inviteOrganizationMemberAction(organizationId, {
        email: email.trim(),
        role,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitación enviada");
      setEmail("");
      setShowInvite(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al invitar");
    } finally {
      setInviteBusy(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display font-semibold">Miembros</h2>
        <button
          onClick={() => setShowInvite((p) => !p)}
          className="cursor-pointer flex items-center gap-1.5 text-sm text-[#0E88E2] hover:underline"
        >
          <Plus className="h-4 w-4" /> Invitar miembro
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={invite}
          className="mb-5 space-y-3 rounded-xl border border-border bg-muted/40 p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="miembro@negocio.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrganizationMemberRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={inviteBusy}
              size="sm"
              className="bg-[#075296] text-white hover:bg-[#0E88E2]"
            >
              {inviteBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Invitar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowInvite(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm">Sin miembros registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const isOwner = m.role === "business_owner";
            const busy = busyId === m.id;
            return (
              <div key={m.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{m.user.name || "-"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={m.status === "active" ? "Activo" : "Suspendido"}
                      color={m.status === "active" ? "green" : "red"}
                    />
                    {isOwner ? (
                      <StatusBadge label={ROLE_LABELS[m.role]} color="gray" />
                    ) : (
                      <Select
                        value={m.role}
                        disabled={busy}
                        onValueChange={(v) => changeRole(m.id, v as OrganizationMemberRole)}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EDITABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                {!isOwner && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.status === "active" ? (
                      <ConfirmButton
                        title="¿Suspender miembro temporalmente?"
                        description={m.user.email}
                        onConfirm={() => setStatus(m.id, "inactive")}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Suspender
                        </Button>
                      </ConfirmButton>
                    ) : (
                      <ConfirmButton
                        title="¿Reactivar miembro?"
                        description={m.user.email}
                        onConfirm={() => setStatus(m.id, "active")}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          Reactivar
                        </Button>
                      </ConfirmButton>
                    )}
                    <ConfirmButton
                      title="¿Dar de baja al miembro?"
                      description="Perderá acceso al negocio."
                      onConfirm={() => remove(m.id)}
                    >
                      <Button variant="outline" size="sm" disabled={busy}>
                        Dar de baja
                      </Button>
                    </ConfirmButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
