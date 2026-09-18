"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmButton } from "@/components/control/confirm-button";
import { INVITATION_STATUSES, formatDate } from "@/lib/mise-labels";
import { resendInvitationAction, cancelInvitationAction } from "@/lib/actions/invitations";
import type { Invitation, Organization } from "@prisma/client";

type InvitationWithOrg = Invitation & { organization: Organization };

export function InvitationsList({ invitations }: { invitations: InvitationWithOrg[] }) {
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

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Mail className="h-10 w-10 opacity-30" />
        <p className="text-sm">Sin invitaciones registradas</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {invitations.map((inv) => {
        const st = INVITATION_STATUSES[inv.status] || { label: inv.status, color: "gray" };
        return (
          <div key={inv.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-muted-foreground">
                <Link href={`/control/negocios/${inv.organization.id}`} className="cursor-pointer hover:text-[#0E88E2]">
                  {inv.organization.commercialName}
                </Link>{" "}
                · {inv.role} · Vence: {formatDate(inv.expiresAt)}
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
  );
}
