import "server-only";
import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";

export async function logAudit(params: {
  action: AuditAction;
  actorUserId?: string | null;
  organizationId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      actorUserId: params.actorUserId ?? null,
      organizationId: params.organizationId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
