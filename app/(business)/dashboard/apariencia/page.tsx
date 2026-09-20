import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { AppearanceForm } from "@/components/business/restaurant/appearance-form";

export const metadata: Metadata = { title: "Apariencia | MISE BY" };

export default async function AparienciaPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let orgRole: string | null | undefined;
  let slug: string | undefined;
  let commercialName = "";
  let currency: string | null | undefined;
  let rest = getRestaurantData(null);
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    orgRole = data?.role;
    slug = data?.organization.slug;
    commercialName = data?.organization.commercialName ?? "";
    currency = data?.organization.currency;
    const page = await getOrCreateMiseLinkPage(user.id);
    rest = getRestaurantData(page.theme);
  } catch (e) {
    console.error("[apariencia page]", e);
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={orgRole} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <h1 className="font-display text-2xl font-semibold">Apariencia</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Colores y visibilidad de tu carta.</p>
          <AppearanceForm
            initial={rest.appearance!}
            categories={rest.categories ?? []}
            products={rest.products ?? []}
            currency={currency}
            slug={slug}
            hours={rest.hours}
            schedule={rest.schedule}
            commercialNameFallback={commercialName}
          />
        </main>
      </div>
    </div>
  );
}
