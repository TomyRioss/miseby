import "server-only";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/audit";
import type { MembershipSource, MembershipStatus } from "@prisma/client";

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
  const membership = await prisma.membership.create({
    data: {
      organizationId: input.organizationId,
      planId: input.planId,
      status: input.status ?? "pending",
      source: input.source ?? "manual",
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      trialEndsAt: input.trialEndsAt,
      internalNotes: input.internalNotes,
      activatedById: actorUserId,
    },
  });

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
  const membership = await prisma.membership.update({ where: { id }, data });

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
