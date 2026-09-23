import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { getAccountDisplay, getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LABELS } from "@/lib/mise-labels";

export const metadata: Metadata = { title: "Mi cuenta | MISE BY" };

const ROLE_LABELS: Record<string, string> = {
  business_owner: "Propietario",
  business_admin: "Admin",
  business_member: "Miembro",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-all sm:text-right">{children}</dd>
    </div>
  );
}

export default async function CuentaPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const account = await getAccountDisplay().catch((e) => {
    console.error("[cuenta display]", e);
    return null;
  });
  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  try {
    data = await getOrganizationForMember(user.id);
  } catch (e) {
    console.error("[cuenta page]", e);
  }
  if (!data?.organization) {
    return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar tu cuenta.</div>;
  }

  const planCode = data.membership?.plan.code;
  const name = account?.name ?? "Cuenta";
  const email = account?.email ?? user.email ?? "-";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={data.role} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <h1 className="font-display text-2xl font-semibold">Mi cuenta</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Resumen de tu cuenta y tu organización.
            </p>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border">
                  <Row label="Nombre">{name}</Row>
                  <Row label="Email">{email}</Row>
                  <Row label="Rol">{ROLE_LABELS[data.role] ?? data.role}</Row>
                  <Row label="Organización">{data.organization.commercialName}</Row>
                  <Row label="Plan actual">
                    {planCode ? (
                      <Badge variant="secondary">{PLAN_LABELS[planCode] ?? planCode}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin plan activo</span>
                    )}
                  </Row>
                </dl>
                <Button asChild className="mt-6 cursor-pointer">
                  <Link href="/dashboard/ajustes">
                    <Settings className="h-4 w-4" />
                    Ir a Ajustes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
