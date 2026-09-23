import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getClientsByOrg, type ClientEntry } from "@/lib/services/customers";
import { PLAN_LABELS } from "@/lib/mise-labels";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { ClientesAutoView } from "@/components/business/restaurant/clientes-auto-view";

export const metadata: Metadata = { title: "Clientes | MISE BY" };

export default async function ClientesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let planName: string | undefined;
  let orgRole: string | null | undefined;
  let clients: ClientEntry[] = [];
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    orgRole = data?.role;
    planName = data?.membership ? (PLAN_LABELS[data.membership.plan.code] ?? data.membership.plan.name) : undefined;
    if (data?.organization?.id) {
      clients = await getClientsByOrg(data.organization.id).catch((e) => {
        console.error("[clientes load]", e);
        return [];
      });
    }
  } catch (e) {
    console.error("[clientes page]", e);
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix={planName} planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={orgRole} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="font-display text-2xl font-semibold">Clientes</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Se arman solos con tus pedidos; también podés agendar manuales en este dispositivo.
            </p>
            <ClientesAutoView initialClients={clients} />
          </div>
        </main>
      </div>
    </div>
  );
}
