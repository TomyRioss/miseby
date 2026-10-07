import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit";
import type { MembershipSource, MembershipStatus } from "@prisma/client";

const ACCESS_STATUSES: MembershipStatus[] = ["active", "trial"];

function grantsAccess(status?: MembershipStatus) {
  return status === "active" || status === "trial";
}

export async function createMembership(
  input: {
    organizationId: string;
    planId: string;
    status?: MembershipStatus;
    source?: MembershipSource;
    startsAt?: Date;
    expiresAt?: Date;
    trialEndsAt?: Date;
    internalNotes?: string;
  },
  actorUserId: string
) {
  const status = input.status ?? "pending";
  const { membership, replacedMembershipIds } = await prisma.$transaction(async (tx) => {
    const replacedMemberships = grantsAccess(status)
      ? await tx.membership.findMany({
          where: {
            organizationId: input.organizationId,
            status: { in: ACCESS_STATUSES },
          },
          select: { id: true },
        })
      : [];

    if (replacedMemberships.length > 0) {
      await tx.membership.updateMany({
        where: {
          organizationId: input.organizationId,
          status: { in: ACCESS_STATUSES },
        },
        data: { status: "suspended" },
      });
    }

    const membership = await tx.membership.create({
      data: {
        organizationId: input.organizationId,
        planId: input.planId,
        status,
        source: input.source ?? "manual",
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        trialEndsAt: input.trialEndsAt,
        internalNotes: input.internalNotes,
        activatedById: actorUserId,
      },
    });

    return {
      membership,
      replacedMembershipIds: replacedMemberships.map(({ id }) => id),
    };
  }, { isolationLevel: "Serializable" });

  for (const entityId of replacedMembershipIds) {
    await logAudit({
      action: "membership_suspended",
      actorUserId,
      organizationId: membership.organizationId,
      entityType: "membership",
      entityId,
    });
  }

  await logAudit({
    action: "membership_created",
    actorUserId,
    organizationId: membership.organizationId,
    entityType: "membership",
    entityId: membership.id,
  });

  return membership;
}

const STATUS_ACTION: Record<MembershipStatus, string> = {
  pending: "membership_changed",
  trial: "membership_changed",
  active: "membership_activated",
  suspended: "membership_suspended",
  expired: "membership_changed",
  cancelled: "membership_cancelled",
};

export async function updateMembership(
  id: string,
  data: Partial<{
    planId: string;
    status: MembershipStatus;
    source: MembershipSource;
    startsAt: Date | null;
    expiresAt: Date | null;
    trialEndsAt: Date | null;
    internalNotes: string;
  }>,
  actorUserId: string
) {
  const { membership, replacedMembershipIds } = await prisma.$transaction(async (tx) => {
    const current = await tx.membership.findUnique({
      where: { id },
      select: { organizationId: true },
    });
    if (!current) throw new Error("Membresía no encontrada");

    const replacedMemberships = grantsAccess(data.status)
      ? await tx.membership.findMany({
          where: {
            organizationId: current.organizationId,
            id: { not: id },
            status: { in: ACCESS_STATUSES },
          },
          select: { id: true },
        })
      : [];

    if (replacedMemberships.length > 0) {
      await tx.membership.updateMany({
        where: {
          organizationId: current.organizationId,
          id: { not: id },
          status: { in: ACCESS_STATUSES },
        },
        data: { status: "suspended" },
      });
    }

    const membership = await tx.membership.update({ where: { id }, data });
    return {
      membership,
      replacedMembershipIds: replacedMemberships.map(({ id: replacedId }) => replacedId),
    };
  }, { isolationLevel: "Serializable" });

  for (const entityId of replacedMembershipIds) {
    await logAudit({
      action: "membership_suspended",
      actorUserId,
      organizationId: membership.organizationId,
      entityType: "membership",
      entityId,
    });
  }

  const action = data.status ? STATUS_ACTION[data.status] : "membership_changed";

  await logAudit({
    action: action as import("@prisma/client").AuditAction,
    actorUserId,
    organizationId: membership.organizationId,
    entityType: "membership",
    entityId: membership.id,
  });

  return membership;
}
