import type { Metadata } from "next";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/mise-labels";

export const metadata: Metadata = { title: "Usuarios — MISE BY Control Center" };

const ROLE_LABELS: Record<string, string> = {
  platform_owner: "Platform Owner",
  business_owner: "Admin negocio",
  business_member: "Miembro",
};
const STATUS_COLORS: Record<string, string> = { active: "green", pending: "amber", suspended: "red" };

export default async function UsersPage() {
  const users = await prisma.userProfile.findMany({
    where: { role: { not: "platform_owner" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Usuarios</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{users.length} usuarios registrados</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin usuarios registrados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{ROLE_LABELS[u.role] || u.role}</TableCell>
                  <TableCell><StatusBadge label={u.status} color={STATUS_COLORS[u.status] || "gray"} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
