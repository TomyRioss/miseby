import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { logAudit } from "@/lib/services/audit";
import type { BusinessType, OrganizationStatus } from "@prisma/client";

export async function generateUniqueSlug(base: string) {
  const root = slugify(base) || "negocio";
  let slug = root;
  let counter = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${root}-${counter}`;
  }
  return slug;
}

export async function createOrganization(
  input: {
    commercialName: string;
    legalName?: string;
    taxId?: string;
    businessType: BusinessType;
    country?: string;
    city?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
    timezone?: string;
  },
  actorUserId: string
) {
  const slug = await generateUniqueSlug(input.commercialName);

  const organization = await prisma.organization.create({
    data: { ...input, slug, status: "pending" },
  });

  await logAudit({
    action: "organization_created",
    actorUserId,
    organizationId: organization.id,
    entityType: "organization",
    entityId: organization.id,
  });

  return organization;
}

export async function updateOrganization(
  id: string,
  data: Partial<{
    commercialName: string;
    legalName: string;
    taxId: string;
    businessType: BusinessType;
    country: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    timezone: string;
    internalNotes: string;
  }>,
  actorUserId: string
) {
  const organization = await prisma.organization.update({ where: { id }, data });

  await logAudit({
    action: "organization_updated",
    actorUserId,
    organizationId: organization.id,
    entityType: "organization",
    entityId: organization.id,
  });

  return organization;
}

const STATUS_ACTION = {
  pending: "organization_updated",
  active: "organization_activated",
  suspended: "organization_suspended",
  cancelled: "organization_cancelled",
} as const;

export async function setOrganizationStatus(
  id: string,
  status: OrganizationStatus,
  actorUserId: string
) {
  const organization = await prisma.organization.update({ where: { id }, data: { status } });

  await logAudit({
    action: STATUS_ACTION[status],
    actorUserId,
    organizationId: organization.id,
    entityType: "organization",
    entityId: organization.id,
  });

  return organization;
}

export async function getOrganizationForMember(userId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, status: "active" },
    include: {
      organization: true,
    },
  });
  if (!member) return null;

  const membership = await prisma.membership.findFirst({
    where: {
      organizationId: member.organizationId,
      status: { in: ["active", "trial"] },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    organization: member.organization,
    role: member.role,
    membership,
  };
}
