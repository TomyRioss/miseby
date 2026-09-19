import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getRestaurantData } from "@/lib/restaurant-theme";
import { RestaurantPublicView } from "@/components/business/restaurant/restaurant-public-view";

type Params = { params: Promise<{ slug: string }> };

async function resolveMenu(slug: string) {
  const key = decodeURIComponent(slug).trim().toLowerCase();
  if (!key) return null;
  const organization = await prisma.organization.findUnique({ where: { slug: key } });
  if (!organization) return null;
  const page = await prisma.miseLinkPage.findUnique({
    where: { organizationId: organization.id },
  });
  if (!page) return null;
  const rest = getRestaurantData(page.theme);
  const published = rest.menuPublished === true;
  let preview = false;
  if (!published) {
    const user = await getCurrentUser().catch(() => null);
    if (!user) return null;
    const own = await getOrganizationForMember(user.id).catch(() => null);
    if (!own?.organization || own.organization.id !== organization.id) return null;
    preview = true;
  }
  return { organization, rest, preview };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const resolved = await resolveMenu(slug);
    if (!resolved) return { title: "Carta no encontrada | MISE BY" };
    const name =
      resolved.rest.appearance?.restaurantName?.trim() ||
      resolved.organization.commercialName;
    return {
      title: `${name} | Carta digital`,
      description: `Carta digital de ${name} en MISE BY.`,
      robots: resolved.preview ? { index: false, follow: false } : undefined,
    };
  } catch (e) {
    console.error("[menu public metadata]", e);
    return { title: "Carta no encontrada | MISE BY" };
  }
}

export default async function MenuPublicPage({ params }: Params) {
  const { slug } = await params;
  let resolved: Awaited<ReturnType<typeof resolveMenu>>;
  try {
    resolved = await resolveMenu(slug);
  } catch (e) {
    console.error("[menu public]", e);
    notFound();
  }
  if (!resolved) notFound();
  const { organization, rest, preview } = resolved;
  const key = decodeURIComponent(slug).trim().toLowerCase();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-[#e8eaed] sm:px-6 sm:py-6 dark:bg-black">
      <RestaurantPublicView
        preview={preview}
        appearance={rest.appearance!}
        categories={rest.categories ?? []}
        products={rest.products ?? []}
        currency={organization.currency}
        hours={rest.hours}
        restaurantName={rest.appearance?.restaurantName}
        slug={key}
        schedule={rest.schedule}
      />
    </div>
  );
}
