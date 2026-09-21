import { prisma } from "@/lib/prisma";

/**
 * Lectura pública de organización por slug, con flag de visibilidad.
 * visible = organization.status === 'active'. null si no existe.
 * No filtra por estado: el consumidor (FE) decide qué mostrar según `visible`.
 */
export async function getPublicOrganizationBySlug(slug: string) {
  try {
    const key = decodeURIComponent(slug).trim().toLowerCase();
    if (!key) return null;
    const organization = await prisma.organization.findUnique({ where: { slug: key } });
    if (!organization) return null;
    return { organization, visible: organization.status === "active" };
  } catch (e) {
    console.error("[public organization]", e);
    return null;
  }
}
