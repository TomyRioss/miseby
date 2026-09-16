import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { IaConfig } from "@/components/business/restaurant/ia-config";

export const metadata: Metadata = { title: "Mise IA | MISE BY" };

export default async function MiseIaPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let rest = getRestaurantData(null);
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    const page = await getOrCreateMiseLinkPage(user.id);
    rest = getRestaurantData(page.theme);
  } catch (e) {
    console.error("[mise-ia page]", e);
  }
  const menuSummary = (rest.products ?? []).filter((p) => p.available).slice(0, 12).map((p) => p.name).join(", ") || "menú en construcción";
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar userLabel={user.email} hasMiseLink={false} planCode={planCode} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <h1 className="font-display text-2xl font-semibold">Mise IA</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Mesero IA que recomienda solo tus platos reales.</p>
          <IaConfig initial={rest.ia ?? { isActive: false }} menuSummary={menuSummary} />
        </main>
      </div>
    </div>
  );
}
