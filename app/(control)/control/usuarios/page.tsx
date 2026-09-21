import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/control/users/users-table";

export const metadata: Metadata = { title: "Usuarios | MISE BY Control Center" };

export default async function UsersPage() {
  const users = await prisma.userProfile.findMany({
    where: { role: { not: "platform_owner" } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Usuarios</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{users.length} usuarios registrados</p>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
