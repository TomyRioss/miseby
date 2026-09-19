import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { PLAN_LABELS } from "@/lib/mise-labels";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { ClientesManager } from "@/components/business/restaurant/clientes-manager";

export const metadata: Metadata = { title: "Clientes | MISE BY" };

export default async function ClientesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let planName: string | undefined;
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    planName = data?.membership ? (PLAN_LABELS[data.membership.plan.code] ?? data.membership.plan.name) : undefined;
  } catch (e) {
    console.error("[clientes page]", e);
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix={planName} planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar userLabel={user.email} hasMiseLink={false} planCode={planCode} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="font-display text-2xl font-semibold">Clientes</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Libreta local de tu negocio: se guarda en este dispositivo, sin fricción.
            </p>
            <ClientesManager />
          </div>
        </main>
      </div>
    </div>
  );
}
