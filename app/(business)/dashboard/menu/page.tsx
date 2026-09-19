import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage, updateTheme } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { buildRestaurantSeed } from "@/lib/menu-seed";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { MenuManager } from "@/components/business/menu/menu-manager";

export const metadata: Metadata = { title: "Menú | MISE BY" };

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  let rest = getRestaurantData(null);
  try {
    data = await getOrganizationForMember(user.id);
    const page = await getOrCreateMiseLinkPage(user.id);
    rest = getRestaurantData(page.theme);
    // Cuentas MISE RESTAURANT nuevas: seed Destacados (destacada) + Recomendados + Bebidas,
    // cada una con un producto semilla (espejo de Platorest). Solo si la carta está vacía.
    if (
      data?.membership?.plan.code === "mise_restaurant" &&
      (rest.categories ?? []).length === 0 &&
      (rest.products ?? []).length === 0
    ) {
      const seed = buildRestaurantSeed();
      await updateTheme(user.id, {
        restaurant: { ...rest, categories: seed.categories, products: seed.products },
      } as Record<string, unknown>);
      rest = { ...rest, categories: seed.categories, products: seed.products };
    }
  } catch (e) {
    console.error("[menu page]", e);
  }
  if (!data?.organization) return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar el menú.</div>;
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={data.membership?.plan.code} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar userLabel={user.email} hasMiseLink={false} planCode={data.membership?.plan.code} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <h1 className="font-display text-2xl font-semibold">Menú</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Secciones, platos con variantes y agregados, todo en un lugar.</p>
          <MenuManager
            initialCategories={rest.categories ?? []}
            initialProducts={rest.products ?? []}
            appearance={rest.appearance!}
            currency={data.organization.currency}
            slug={data.organization.slug}
            hours={rest.hours}
            menuPublished={rest.menuPublished === true}
            schedule={rest.schedule}
          />
        </main>
      </div>
    </div>
  );
}
