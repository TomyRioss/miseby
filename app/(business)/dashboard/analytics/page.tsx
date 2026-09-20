import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData, productPrice } from "@/lib/restaurant-theme";
import { prisma } from "@/lib/prisma";
import { PLAN_LABELS } from "@/lib/mise-labels";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { AnalyticsCards } from "@/components/business/restaurant/analytics-cards";
import type { ChecklistItem } from "@/components/business/restaurant/analytics-checklist";

export const metadata: Metadata = { title: "Analytics | MISE BY" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let planName: string | undefined;
  let rest = getRestaurantData(null);
  let linkClicks = 0;
  let clickData: { title: string; clicks: number }[] = [];
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    planName = data?.membership ? (PLAN_LABELS[data.membership.plan.code] ?? data.membership.plan.name) : undefined;
    const page = await getOrCreateMiseLinkPage(user.id);
    rest = getRestaurantData(page.theme);
    const [clicks, items] = await Promise.all([
      prisma.miseLinkItem.aggregate({ where: { pageId: page.id }, _sum: { clickCount: true } }).catch(() => null),
      prisma.miseLinkItem
        .findMany({
          where: { pageId: page.id, active: true },
          select: { title: true, clickCount: true },
          orderBy: { clickCount: "desc" },
          take: 8,
        })
        .catch((): { title: string | null; clickCount: number }[] => []),
    ]);
    linkClicks = clicks?._sum.clickCount ?? 0;
    clickData = (items ?? []).map((item: { title: string | null; clickCount: number }, i: number) => ({
      title: item.title?.trim() || `Enlace ${i + 1}`,
      clicks: item.clickCount ?? 0,
    }));
  } catch (e) {
    console.error("[analytics page]", e);
  }

  const categories = rest.categories ?? [];
  const products = rest.products ?? [];
  const visibleProducts = products.filter((p) => p.available);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const dishes = visibleProducts.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name || "Sin nombre",
    categoryName: categoryName.get(p.categoryId) ?? "Sin sección",
    price: productPrice(p),
    hasPhoto: Boolean(p.imageUrl),
    hasDescription: Boolean(p.description?.trim()),
  }));

  const sections = categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const inSection = products.filter((p) => p.categoryId === c.id);
      return {
        id: c.id,
        name: c.name,
        total: inSection.length,
        visible: inSection.filter((p) => p.available).length,
      };
    });

  const withPhoto = visibleProducts.filter((p) => p.imageUrl).length;
  const withDescription = visibleProducts.filter((p) => p.description?.trim()).length;
  const withPrice = visibleProducts.filter((p) => productPrice(p) > 0).length;

  const checklist: ChecklistItem[] = [
    {
      done: categories.length > 0,
      label: "1 sección mínima",
      detail: categories.length > 0 ? `${categories.length} creadas` : "Ej: Entradas, Principales, Postres",
      href: "/dashboard/categorias",
    },
    {
      done: visibleProducts.length > 0,
      label: "1 plato visible",
      detail: visibleProducts.length > 0 ? `${visibleProducts.length} visibles` : "Cargá tu primer plato",
      href: "/dashboard/productos",
    },
    {
      done: visibleProducts.length > 0 && withPrice === visibleProducts.length,
      label: "Precios en visibles",
      detail: visibleProducts.length > 0 ? `${withPrice}/${visibleProducts.length} con precio` : "Sin platos visibles aún",
      href: "/dashboard/productos",
    },
    {
      done: visibleProducts.length > 0 && withPhoto === visibleProducts.length,
      label: "Fotos en visibles",
      detail: visibleProducts.length > 0 ? `${withPhoto}/${visibleProducts.length} con foto` : "Las fotos venden más",
      href: "/dashboard/productos",
    },
    {
      done: visibleProducts.length > 0 && withDescription === visibleProducts.length,
      label: "Descripciones",
      detail: visibleProducts.length > 0 ? `${withDescription}/${visibleProducts.length} con texto` : "Contá qué lleva cada plato",
      href: "/dashboard/productos",
    },
    {
      done: rest.menuPublished === true,
      label: "Carta publicada",
      detail: rest.menuPublished === true ? "Visible para clientes" : "Sigue en borrador",
      href: "/dashboard/catalogo",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix={planName} planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="font-display text-2xl font-semibold">Analytics</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">Salud de tu carta y uso.</p>
            <AnalyticsCards
              categories={categories.length}
              products={products.length}
              available={visibleProducts.length}
              linkClicks={linkClicks}
              menuPublished={rest.menuPublished === true}
              planName={planName}
              clickData={clickData}
              dishes={dishes}
              sections={sections}
              checklist={checklist}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
