import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { InvitationsList } from "@/components/control/invitations/invitations-list";

export const metadata: Metadata = { title: "Invitaciones — MISE BY Control Center" };

export default async function InvitationsPage() {
  const invitations = await prisma.invitation.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Invitaciones</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Las invitaciones se crean desde el detalle de cada negocio.
      </p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <InvitationsList invitations={invitations} />
      </div>
    </div>
  );
}
