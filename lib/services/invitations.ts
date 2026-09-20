import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { logAudit } from "@/lib/services/audit";
import type { InvitationRole } from "@prisma/client";

const INVITATION_TTL_DAYS = 7;

function buildInvitationEmail(token: string) {
  const domain = process.env.WEBSITE_DOMAIN || "http://localhost:3000";
  const link = `${domain}/invitaciones/${token}`;
  return {
    link,
    html: `<p>Fuiste invitado a MISE BY.</p><p><a href="${link}">Aceptar invitación</a></p>`,
  };
}

export async function createInvitation(
  input: { organizationId: string; email: string; role: InvitationRole },
  actorUserId: string
) {
  await prisma.invitation.updateMany({
    where: { organizationId: input.organizationId, email: input.email, status: "pending" },
    data: { status: "cancelled" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: input.organizationId,
      email: input.email,
      role: input.role,
      invitedById: actorUserId,
      token,
      status: "pending",
      expiresAt,
    },
  });

  const { link, html } = buildInvitationEmail(token);
  await sendMail(input.email, "Invitación a MISE BY", html);

  await logAudit({
    action: "invitation_created",
    actorUserId,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { link },
  });

  return invitation;
}

export async function resendInvitation(id: string, actorUserId: string) {
  const invitation = await prisma.invitation.findUniqueOrThrow({ where: { id } });
  const { html } = buildInvitationEmail(invitation.token);
  await sendMail(invitation.email, "Invitación a MISE BY", html);

  await logAudit({
    action: "invitation_resent",
    actorUserId,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
  });

  return invitation;
}

export async function cancelInvitation(id: string, actorUserId: string) {
  const invitation = await prisma.invitation.update({
    where: { id },
    data: { status: "cancelled" },
  });

  await logAudit({
    action: "invitation_cancelled",
    actorUserId,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
  });

  return invitation;
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!invitation) return null;

  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "expired" } });
    invitation.status = "expired";
  }

  const existingUser = await prisma.userProfile.findUnique({ where: { email: invitation.email } });

  return { invitation, userExists: Boolean(existingUser) };
}

export async function acceptInvitation(token: string, password: string | undefined, name?: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.status !== "pending") throw new Error("Invitación no disponible");
  if (invitation.expiresAt < new Date()) throw new Error("Invitación expirada");

  let user = await prisma.userProfile.findUnique({ where: { email: invitation.email } });

  if (!user) {
    if (!password || password.length < 8) {
      throw new Error("Password requerido (mínimo 8 caracteres)");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.userProfile.create({
      data: {
        name,
        email: invitation.email,
        passwordHash,
        role: invitation.role === "business_member" ? "business_member" : invitation.role,
        status: "active",
      },
    });
  } else if (password && password.length >= 8) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.userProfile.update({ where: { id: user.id }, data: { passwordHash } });
  }

  const existingMember = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
  });

  if (!existingMember) {
    await prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        status: "active",
      },
    });
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "accepted", acceptedAt: new Date(), acceptedById: user.id },
  });

  await logAudit({
    action: "invitation_accepted",
    actorUserId: user.id,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
  });

  return user;
}
