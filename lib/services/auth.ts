import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { generateUniqueSlug } from "@/lib/services/organizations";
import { logAudit } from "@/lib/services/audit";
import type { BusinessType, PlanCode } from "@prisma/client";

const RESET_TOKEN_TTL_MINUTES = 60;
const TRIAL_DAYS = 14;

const PLAN_NAMES: Record<PlanCode, string> = {
  mise_link: "Mise Link",
  mise: "Mise",
  mise_restaurant: "Mise Restaurant",
};

const BUSINESS_TYPE_BY_PLAN: Record<PlanCode, BusinessType> = {
  mise_restaurant: "restaurant",
  mise: "commerce",
  mise_link: "other",
};

export async function registerBusinessOwner(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  country: string;
  planCode?: PlanCode;
}) {
  const planCode: PlanCode = input.planCode ?? "mise";
  const existing = await prisma.userProfile.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("El email ya está en uso");

  const slug = await generateUniqueSlug(input.businessName);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.upsert({
      where: { code: planCode },
      update: {},
      create: { code: planCode, name: PLAN_NAMES[planCode], status: "active" },
    });

    const user = await tx.userProfile.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "business_owner",
        status: "active",
      },
    });

    const organization = await tx.organization.create({
      data: {
        commercialName: input.businessName,
        businessType: BUSINESS_TYPE_BY_PLAN[planCode],
        country: input.country,
        slug,
        status: "active",
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: "business_owner",
        status: "active",
      },
    });

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const membership = await tx.membership.create({
      data: {
        organizationId: organization.id,
        planId: plan.id,
        status: "trial",
        source: "trial",
        startsAt: now,
        trialEndsAt,
        expiresAt: trialEndsAt,
      },
    });

    return { user, organization, membership, plan };
  });

  await logAudit({
    action: "organization_created",
    actorUserId: result.user.id,
    organizationId: result.organization.id,
    entityType: "organization",
    entityId: result.organization.id,
    metadata: { source: "self_register", planCode },
  });

  await logAudit({
    action: "membership_created",
    actorUserId: result.user.id,
    organizationId: result.organization.id,
    entityType: "membership",
    entityId: result.membership.id,
    metadata: { source: "trial", planCode, planId: result.plan.id },
  });

  return result;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.userProfile.findUnique({ where: { email } });
  if (!user) return; // no revelar si el email existe

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const domain = process.env.WEBSITE_DOMAIN || "http://localhost:3000";
  const link = `${domain}/reset-password?token=${token}`;
  await sendMail(
    email,
    "Recuperar contraseña | MISE BY",
    `<p><a href="${link}">Restablecer contraseña</a> (expira en ${RESET_TOKEN_TTL_MINUTES} minutos)</p>`
  );
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new Error("Token inválido o expirado");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.userProfile.findUniqueOrThrow({ where: { id: userId } });
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) throw new Error("Contraseña actual incorrecta");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.userProfile.update({ where: { id: userId }, data: { passwordHash } });

  await logAudit({
    action: "user_password_changed",
    actorUserId: userId,
    entityType: "user",
    entityId: userId,
  });
}
