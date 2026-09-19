import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getRestaurantData } from "@/lib/restaurant-theme";

/**
 * Menú público por slug de organización. Solo lectura, sin cambios de DB.
 * Gate de publicado (port de TOM-158): si el menú no está publicado, solo el
 * dueño de la organización lo ve en modo preview; el resto recibe null
 * (la página responde notFound).
 */
export async function getPublicMenuBySlug(slug: string) {
  try {
    const key = decodeURIComponent(slug).trim().toLowerCase();
    if (!key) return null;
    const organization = await prisma.organization.findUnique({ where: { slug: key } });
    if (!organization || organization.status !== "active") return null;
    const page = await prisma.miseLinkPage
      .findUnique({ where: { organizationId: organization.id } })
      .catch(() => null);
    const rest = getRestaurantData((page?.theme ?? null) as unknown);
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
  } catch (e) {
    console.error("[public menu]", e);
    return null;
  }
}
