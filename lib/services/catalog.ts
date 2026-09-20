import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getRestaurantData, type RestaurantData } from "@/lib/restaurant-theme";

export type PublicCatalog = {
  slug: string;
  commercialName: string;
  currency: string | null;
  data: RestaurantData;
  /** true cuando lo ve el dueño sin publicar (igual que /menu/[slug]). */
  preview: boolean;
};

/**
 * Lectura pública del catálogo por slug de organización.
 * Reutiliza el mismo JSON `theme.restaurant` del editor (sin cambios de DB).
 * Gate de publicado (paridad con getPublicMenuBySlug): si el catálogo no está
 * publicado, solo el dueño de la organización lo ve en modo preview
 * (el iframe del editor); el resto recibe null (la página responde notFound).
 */
export async function getPublicCatalogBySlug(slug: string): Promise<PublicCatalog | null> {
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
  let preview = false;
  if (data.menuPublished !== true) {
    const user = await getCurrentUser().catch(() => null);
    if (!user) return null;
    const own = await getOrganizationForMember(user.id).catch(() => null);
    if (!own?.organization || own.organization.id !== org.id) return null;
    preview = true;
  }
  return {
    slug: org.slug,
    commercialName: org.commercialName,
    currency: org.currency,
    data,
    preview,
  };
}
