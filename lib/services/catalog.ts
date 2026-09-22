import "server-only";
import { prisma } from "@/lib/prisma";
import { getRestaurantData, type RestaurantData } from "@/lib/restaurant-theme";

export type PublicCatalog = {
  slug: string;
  commercialName: string;
  currency: string | null;
  data: RestaurantData;
  /** Siempre false: el catálogo es público desde el momento uno (sin lógica de publicado). */
  preview: boolean;
};

/**
 * Lectura pública del catálogo por slug de organización.
 * Reutiliza el mismo JSON `theme.restaurant` del editor (sin cambios de DB).
 * El catálogo es público siempre: solo exige org activa con página.
 */
export async function getPublicCatalogBySlug(slug: string): Promise<PublicCatalog | null> {
  try {
    const normalized = decodeURIComponent(slug).trim().toLowerCase();
    if (!normalized) return null;
    const org = await prisma.organization.findUnique({
      where: { slug: normalized },
      select: {
        id: true,
        slug: true,
        commercialName: true,
        currency: true,
        status: true,
        miselinkPage: { select: { theme: true } },
      },
    });
    if (!org || org.status !== "active" || !org.miselinkPage) return null;
    const data = getRestaurantData(org.miselinkPage.theme);
    return {
      slug: org.slug,
      commercialName: org.commercialName,
      currency: org.currency,
      data,
      preview: false,
    };
  } catch (e) {
    console.error("[public catalog]", e);
    return null;
  }
}
