"use client";

import { useState } from "react";
import { Plus, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/control/confirm-button";
import { INVITATION_STATUSES, formatDate } from "@/lib/mise-labels";
import {
  createInvitationAction,
  resendInvitationAction,
  cancelInvitationAction,
} from "@/lib/actions/invitations";
import type { Invitation, InvitationRole } from "@prisma/client";

export function OrganizationInvitations({
  organizationId,
  invitations,
}: {
  organizationId: string;
  invitations: Invitation[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("business_owner");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await createInvitationAction({ organizationId, email, role });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitación enviada");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al invitar");
    } finally {
      setBusy(false);
    }
  };

  const resend = async (id: string) => {
    try {
      const result = await resendInvitationAction(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Invitación reenviada");
    } catch (err) {
      console.error(err);
      toast.error("Error al reenviar");
    }
  };

  const cancel = async (id: string) => {
    try {
      const result = await cancelInvitationAction(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Invitación cancelada");
    } catch (err) {
      console.error(err);
      toast.error("Error al cancelar");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display font-semibold">Invitaciones</h2>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="cursor-pointer flex items-center gap-1.5 text-sm text-[#0E88E2] hover:underline"
        >
          <Plus className="h-4 w-4" /> Invitar usuario
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-5 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as InvitationRole)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="business_owner">Administrador (business_owner)</SelectItem>
                  <SelectItem value="business_member">Miembro (business_member)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} size="sm" className="bg-[#075296] text-white hover:bg-[#0E88E2]">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Send className="h-3.5 w-3.5" /> Enviar invitación
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin invitaciones registradas.</p>
      ) : (
        <div className="divide-y divide-border">
          {invitations.map((inv) => {
            const st = INVITATION_STATUSES[inv.status] || { label: inv.status, color: "gray" };
            return (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.role} · Vence: {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={st.label} color={st.color} />
                  {inv.status === "pending" && (
                    <>
                      <button
                        onClick={() => resend(inv.id)}
                        className="cursor-pointer rounded-lg border border-border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
                      >
                        Reenviar
                      </button>
                      <ConfirmButton title="¿Cancelar esta invitación?" onConfirm={() => cancel(inv.id)}>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 transition-colors hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                      </ConfirmButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
