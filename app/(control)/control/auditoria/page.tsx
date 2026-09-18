import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/mise-labels";

export const metadata: Metadata = { title: "Auditoría | MISE BY Control Center" };

const ACTION_LABELS: Record<string, string> = {
  organization_created: "Negocio creado",
  organization_updated: "Negocio editado",
  organization_activated: "Negocio activado",
  organization_suspended: "Negocio suspendido",
  organization_cancelled: "Negocio cancelado",
  membership_created: "Membresía creada",
  membership_changed: "Membresía modificada",
  membership_activated: "Membresía activada",
  membership_suspended: "Membresía suspendida",
  membership_cancelled: "Membresía cancelada",
  invitation_created: "Invitación enviada",
  invitation_resent: "Invitación reenviada",
  invitation_cancelled: "Invitación cancelada",
  invitation_accepted: "Invitación aceptada",
  user_password_changed: "Contraseña cambiada",
  platform_owner_login: "Inicio de sesión",
};

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actorUser: true, organization: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Auditoría</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Registro append-only de acciones sensibles.</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin registros de auditoría</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Negocio</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{ACTION_LABELS[log.action] || log.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.organization ? (
                      <Link href={`/control/negocios/${log.organization.id}`} className="cursor-pointer hover:text-[#0E88E2]">
                        {log.organization.commercialName}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.actorUser ? log.actorUser.name || log.actorUser.email : "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.entityType || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
