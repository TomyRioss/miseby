import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { RESERVED_USERNAMES } from "@/lib/miselink/reserved-usernames";
import { getOrganizationForMember } from "@/lib/services/organizations";
import type { MiseLinkPage, MiseLinkItem, MiseLinkSocial } from "@prisma/client";
import type { ProfileInput, LinkItemInput, SocialInput } from "@/lib/validations/miselink";

export type MiseLinkPageWithRelations = MiseLinkPage & {
  items: MiseLinkItem[];
  socials: MiseLinkSocial[];
};

const PAGE_INCLUDE = {
  items: { orderBy: { position: "asc" } },
  socials: { orderBy: { position: "asc" } },
} as const;

async function resolveOrgWithMiseLink(userId: string) {
  const data = await getOrganizationForMember(userId);
  if (!data?.organization) throw new Error("No estás asociado a ningún negocio.");
  const hasPlan =
    data.membership?.plan.code === "mise_link" &&
    (data.membership.status === "active" || data.membership.status === "trial");
  if (!hasPlan) throw new Error("Tu negocio no tiene el plan MISE LINK activo.");
  return data.organization;
}

async function resolvePageForUser(userId: string): Promise<MiseLinkPageWithRelations> {
  const org = await resolveOrgWithMiseLink(userId);
  const page = await prisma.miseLinkPage.findUnique({
    where: { organizationId: org.id },
    include: PAGE_INCLUDE,
  });
  if (!page) throw new Error("La página MISE LINK todavía no existe.");
  return page;
}

async function generateUniqueUsername(base: string): Promise<string> {
  let root = slugify(base) || "mi-pagina";
  if (root.length < 3) root = `${root}-pagina`;
  root = root.slice(0, 24);
  let candidate = root;
  let n = 1;
  while (
    RESERVED_USERNAMES.has(candidate) ||
    (await prisma.miseLinkPage.findUnique({ where: { username: candidate } }))
  ) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export async function getOrCreateMiseLinkPage(
  userId: string,
): Promise<MiseLinkPageWithRelations> {
  const org = await resolveOrgWithMiseLink(userId);
  const existing = await prisma.miseLinkPage.findUnique({
    where: { organizationId: org.id },
    include: PAGE_INCLUDE,
  });
  if (existing) return existing;

  const username = await generateUniqueUsername(org.slug ?? org.commercialName);
  return prisma.miseLinkPage.create({
    data: {
      organizationId: org.id,
      username,
      displayName: org.commercialName,
    },
    include: PAGE_INCLUDE,
  });
}

export async function getPublicPageByUsername(
  username: string,
): Promise<MiseLinkPageWithRelations | null> {
  const page = await prisma.miseLinkPage.findUnique({
    where: { username: username.toLowerCase() },
    include: {
      items: { where: { active: true }, orderBy: { position: "asc" } },
      socials: { orderBy: { position: "asc" } },
    },
  });
  if (!page || !page.published) return null;
  return page;
}

export async function getOwnPageByUsername(
  userId: string,
  username: string,
): Promise<MiseLinkPageWithRelations | null> {
  const data = await getOrganizationForMember(userId).catch(() => null);
  if (!data?.organization) return null;
  const page = await prisma.miseLinkPage.findUnique({
    where: { username: username.toLowerCase() },
    include: PAGE_INCLUDE,
  });
  if (!page || page.organizationId !== data.organization.id) return null;
  return page;
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const next = username.toLowerCase();
  if (RESERVED_USERNAMES.has(next)) throw new Error("Ese nombre no está disponible.");
  try {
    await prisma.miseLinkPage.update({ where: { id: page.id }, data: { username: next } });
  } catch (e) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      throw new Error("Ese nombre ya está en uso.");
    }
    throw e;
  }
}

export async function isUsernameAvailable(
  userId: string,
  username: string,
): Promise<boolean> {
  const next = username.toLowerCase();
  if (RESERVED_USERNAMES.has(next)) return false;
  const page = await resolvePageForUser(userId);
  const taken = await prisma.miseLinkPage.findUnique({
    where: { username: next },
    select: { id: true },
  });
  return !taken || taken.id === page.id;
}

export async function updateTheme(userId: string, data: Record<string, unknown>): Promise<void> {
  const page = await resolvePageForUser(userId);
  const current = (page.theme ?? {}) as Record<string, unknown>;
  const next = { ...(current as object), ...(data as object) };
  await prisma.miseLinkPage.update({ where: { id: page.id }, data: { theme: next } });
}

export async function updateProfile(userId: string, data: ProfileInput): Promise<void> {
  const page = await resolvePageForUser(userId);
  await prisma.miseLinkPage.update({
    where: { id: page.id },
    data: {
      ...("displayName" in data ? { displayName: data.displayName ?? null } : {}),
      ...("bio" in data ? { bio: data.bio ?? null } : {}),
      ...("avatarUrl" in data ? { avatarUrl: data.avatarUrl ? data.avatarUrl : null } : {}),
      ...(data.showFollowers !== undefined ? { showFollowers: data.showFollowers } : {}),
    },
  });
}

export async function setPublished(userId: string, published: boolean): Promise<void> {
  const page = await resolvePageForUser(userId);
  if (published) {
    const activeCount = await prisma.miseLinkItem.count({
      where: { pageId: page.id, active: true },
    });
    if (activeCount === 0) {
      throw new Error("Agregá al menos un enlace activo antes de publicar.");
    }
  }
  await prisma.miseLinkPage.update({ where: { id: page.id }, data: { published } });
}

export async function createLink(userId: string, data: LinkItemInput): Promise<string> {
  const page = await resolvePageForUser(userId);
  const last = await prisma.miseLinkItem.findFirst({
    where: { pageId: page.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const item = await prisma.miseLinkItem.create({
    data: {
      pageId: page.id,
      type: data.type ?? "link",
      title: data.title,
      url: data.url ? data.url : null,
      active: data.active ?? true,
      position: (last?.position ?? -1) + 1,
      parentId: data.parentId ?? null,
      data: data.data ?? {},
      scheduledStart: data.scheduledStart ?? null,
      scheduledEnd: data.scheduledEnd ?? null,
    },
  });
  return item.id;
}

export async function updateLink(
  userId: string,
  itemId: string,
  data: Partial<LinkItemInput>,
): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkItem.updateMany({
    where: { id: itemId, pageId: page.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.url !== undefined ? { url: data.url ? data.url : null } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.data !== undefined ? { data: data.data ?? {} } : {}),
      ...(data.scheduledStart !== undefined ? { scheduledStart: data.scheduledStart } : {}),
      ...(data.scheduledEnd !== undefined ? { scheduledEnd: data.scheduledEnd } : {}),
    },
  });
  if (count === 0) throw new Error("Enlace no encontrado.");
}

export async function deleteLink(userId: string, itemId: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkItem.deleteMany({
    where: { id: itemId, pageId: page.id },
  });
  if (count === 0) throw new Error("Enlace no encontrado.");
}

export async function reorderLinks(userId: string, ids: string[]): Promise<void> {
  const page = await resolvePageForUser(userId);
  const owned = await prisma.miseLinkItem.findMany({
    where: { pageId: page.id },
    select: { id: true },
  });
  const ownedSet = new Set(owned.map((i) => i.id));
  if (ids.length !== ownedSet.size || ids.some((id) => !ownedSet.has(id))) {
    throw new Error("Lista de orden inválida.");
  }
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.miseLinkItem.update({ where: { id }, data: { position: index } }),
    ),
  );
}

export async function createSocial(userId: string, data: SocialInput): Promise<string> {
  const page = await resolvePageForUser(userId);
  const last = await prisma.miseLinkSocial.findFirst({
    where: { pageId: page.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const social = await prisma.miseLinkSocial.create({
    data: {
      pageId: page.id,
      network: data.network,
      url: data.url,
      position: (last?.position ?? -1) + 1,
    },
  });
  return social.id;
}

export async function deleteSocial(userId: string, socialId: string): Promise<void> {
  const page = await resolvePageForUser(userId);
  const { count } = await prisma.miseLinkSocial.deleteMany({
    where: { id: socialId, pageId: page.id },
  });
  if (count === 0) throw new Error("Red social no encontrada.");
}
