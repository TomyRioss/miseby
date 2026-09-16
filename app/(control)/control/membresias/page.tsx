import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { MEMBERSHIP_SOURCE_LABELS, MEMBERSHIP_STATUSES, PLAN_LABELS, formatDate } from "@/lib/mise-labels";

export const metadata: Metadata = { title: "Membresías | MISE BY Control Center" };

export default async function MembershipsPage() {
  const memberships = await prisma.membership.findMany({
    include: { organization: true, plan: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Membresías</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{memberships.length} membresías registradas</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {memberships.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <CreditCard className="h-10 w-10 opacity-30" />
            <p className="text-sm">Sin membresías registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Vence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.map((mb) => {
                const st = MEMBERSHIP_STATUSES[mb.status] || { label: mb.status, color: "gray" };
                return (
                  <TableRow key={mb.id}>
                    <TableCell>
                      <Link href={`/control/negocios/${mb.organization.id}`} className="font-medium hover:text-[#0E88E2]">
                        {mb.organization.commercialName}
                      </Link>
                    </TableCell>
                    <TableCell>{PLAN_LABELS[mb.plan.code] || mb.plan.name}</TableCell>
                    <TableCell><StatusBadge label={st.label} color={st.color} /></TableCell>
                    <TableCell className="text-muted-foreground">{MEMBERSHIP_SOURCE_LABELS[mb.source] || mb.source}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(mb.startsAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(mb.expiresAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
