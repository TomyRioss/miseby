import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { BusinessForm } from "@/components/business/restaurant/business-form";

export const metadata: Metadata = { title: "Mi negocio | MISE BY" };

export default async function NegocioPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  let rest = getRestaurantData(null);
  try {
    data = await getOrganizationForMember(user.id);
    const page = await getOrCreateMiseLinkPage(user.id).catch(() => null);
    rest = getRestaurantData(page?.theme);
  } catch (e) {
    console.error("[negocio page]", e);
  }
  if (!data?.organization) return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar tu negocio.</div>;
  // TOM-193: business_member no accede a Mi negocio → contenido del catálogo según plan.
  if (data.role === "business_member") {
    redirect(data.membership?.plan.code === "mise_restaurant" ? "/dashboard/menu" : "/dashboard/catalogo");
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={data.membership?.plan.code} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={data.membership?.plan.code} orgRole={data.role} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <h1 className="font-display text-2xl font-semibold">Mi negocio</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Ficha visible en tu menú y pedidos.</p>
          <BusinessForm
            initial={data.organization}
            extra={{ hours: rest.hours, whatsapp: rest.whatsapp, instagram: rest.instagram, facebook: rest.facebook, tiktok: rest.tiktok, x: rest.x, schedule: rest.schedule }}
            canEdit={data.role === "business_owner"}
          />
        </main>
      </div>
    </div>
  );
}
