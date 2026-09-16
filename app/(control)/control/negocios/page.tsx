import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CreateOrganizationDialog } from "@/components/control/organizations/create-organization-dialog";
import { OrganizationsList } from "@/components/control/organizations/organizations-list";

export const metadata: Metadata = { title: "Negocios | MISE BY Control Center" };

export default async function BusinessesPage() {
  const organizations = await prisma.organization.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Negocios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {organizations.length} {organizations.length === 1 ? "negocio" : "negocios"} registrados
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      <div className="mt-6">
        <OrganizationsList organizations={organizations} />
      </div>
    </div>
  );
}
