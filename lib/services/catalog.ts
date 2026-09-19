import "server-only";
import { prisma } from "@/lib/prisma";
import { getRestaurantData, type RestaurantData } from "@/lib/restaurant-theme";

export type PublicCatalog = {
  slug: string;
  commercialName: string;
  currency: string | null;
  data: RestaurantData;
};

/**
 * Lectura pública del catálogo por slug de organización.
 * Reutiliza el mismo JSON `theme.restaurant` del editor (sin cambios de DB).
 * Solo visible si el catálogo está publicado.
 */
export async function getPublicCatalogBySlug(slug: string): Promise<PublicCatalog | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const org = await prisma.organization.findUnique({
    where: { slug: normalized },
    select: {
      slug: true,
      commercialName: true,
      currency: true,
      status: true,
      miselinkPage: { select: { theme: true } },
    },
  });
  if (!org || org.status !== "active" || !org.miselinkPage) return null;
  const data = getRestaurantData(org.miselinkPage.theme);
  if (data.menuPublished !== true) return null;
  return {
    slug: org.slug,
    commercialName: org.commercialName,
    currency: org.currency,
    data,
  };
}
