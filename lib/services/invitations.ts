import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { logAudit } from "@/lib/services/audit";
import type { InvitationRole } from "@prisma/client";
import { passwordSchema, securityTokenSchema, forgotPasswordSchema } from "@/lib/validations/auth";
import { allowRequest } from "@/lib/security/rate-limit";

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
  const email = forgotPasswordSchema.parse({ email: input.email }).email;
  if (!(await allowRequest("invite-send-global", "all", 200, 3600)) ||
      !(await allowRequest("invite-send-actor", actorUserId, 20, 3600))) {
    throw new Error("Demasiadas invitaciones. Esperá antes de enviar otra.");
  }
  await prisma.invitation.updateMany({
    where: { organizationId: input.organizationId, email, status: "pending" },
    data: { status: "cancelled" },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: input.organizationId,
      email,
      role: input.role,
      invitedById: actorUserId,
      token,
      status: "pending",
      expiresAt,
    },
  });

  const { html } = buildInvitationEmail(token);
  await sendMail(email, "Invitación a MISE BY", html);

  await logAudit({
    action: "invitation_created",
    actorUserId,
    organizationId: invitation.organizationId,
    entityType: "invitation",
    entityId: invitation.id,
    metadata: { email: invitation.email },
  });

  return invitation;
}

export async function resendInvitation(id: string, actorUserId: string) {
  if (!(await allowRequest("invite-resend", actorUserId, 20, 3600))) throw new Error("Demasiados reenvíos. Esperá antes de intentar otra vez.");
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
  if (!securityTokenSchema.safeParse(token).success) return null;
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });
  if (!invitation) return null;

  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    invitation.status = "expired";
  }

  const existingUser = await prisma.userProfile.findUnique({ where: { email: invitation.email.trim().toLowerCase() } });

  return { invitation, userExists: Boolean(existingUser) };
}

export async function acceptInvitation(token: string, password: string | undefined, name?: string, authenticatedUserId?: string) {
  securityTokenSchema.parse(token);
  const user = await prisma.$transaction(async (tx) => {
  const invitation = await tx.invitation.findUnique({ where: { token } });
  if (!invitation) throw new Error("Invitación no encontrada");
  if (invitation.status !== "pending") throw new Error("Invitación no disponible");
  if (invitation.expiresAt < new Date()) throw new Error("Invitación expirada");

  const email = invitation.email.trim().toLowerCase();
  let user = await tx.userProfile.findUnique({ where: { email } });

  if (!user) {
    if (!passwordSchema.safeParse(password).success) {
      throw new Error("Password requerido (mínimo 8 caracteres)");
    }
    const passwordHash = await bcrypt.hash(password!, 10);
    user = await tx.userProfile.create({
      data: {
        name,
        email,
        passwordHash,
        role: invitation.role === "business_member" ? "business_member" : invitation.role,
        status: "active",
      },
    });
  } else {
    if (user.status !== "active") throw new Error("Verificá tu cuenta antes de aceptar la invitación.");
    if (authenticatedUserId !== user.id && (!password || !(await bcrypt.compare(password, user.passwordHash)))) {
      throw new Error("Ingresá la contraseña actual de la cuenta invitada.");
    }
  }

  const existingMember = await tx.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
  });

  if (!existingMember) {
    await tx.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        role: invitation.role,
        status: "active",
      },
    });
  }

  const consumed = await tx.invitation.updateMany({
    where: { id: invitation.id, status: "pending", expiresAt: { gt: new Date() } },
    data: { status: "accepted", acceptedAt: new Date(), acceptedById: user.id },
  });
  if (consumed.count !== 1) throw new Error("Invitación no disponible");
  return { profile: user, invitation };
  }, { isolationLevel: "Serializable" });

  await logAudit({
    action: "invitation_accepted",
    actorUserId: user.profile.id,
    organizationId: user.invitation.organizationId,
    entityType: "invitation",
    entityId: user.invitation.id,
  });

  return user.profile;
}
