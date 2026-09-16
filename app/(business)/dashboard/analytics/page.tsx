import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { prisma } from "@/lib/prisma";
import { PLAN_LABELS } from "@/lib/mise-labels";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { AnalyticsCards } from "@/components/business/restaurant/analytics-cards";

export const metadata: Metadata = { title: "Analytics | MISE BY" };

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  let planCode: string | undefined;
  let planName: string | undefined;
  let rest = getRestaurantData(null);
  let linkClicks = 0;
  try {
    const data = await getOrganizationForMember(user.id);
    planCode = data?.membership?.plan.code;
    planName = data?.membership ? (PLAN_LABELS[data.membership.plan.code] ?? data.membership.plan.name) : undefined;
    const page = await getOrCreateMiseLinkPage(user.id);
    rest = getRestaurantData(page.theme);
    const clicks = await prisma.miseLinkItem.aggregate({ where: { pageId: page.id }, _sum: { clickCount: true } }).catch(() => null);
    linkClicks = clicks?._sum.clickCount ?? 0;
  } catch (e) {
    console.error("[analytics page]", e);
  }
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix={planName} planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar userLabel={user.email} hasMiseLink={false} planCode={planCode} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <h1 className="font-display text-2xl font-semibold">Analytics</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Salud de tu carta y uso.</p>
          <AnalyticsCards
            categories={(rest.categories ?? []).length}
            products={(rest.products ?? []).length}
            available={(rest.products ?? []).filter((p) => p.available).length}
            linkClicks={linkClicks}
            menuPublished={rest.menuPublished === true}
            planName={planName}
          />
        </main>
      </div>
    </div>
  );
}
