import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

/**
 * Credenciales demo SOLO para dev local. Nunca hardcodear passwords:
 * - Si existen SEED_DEMO_PASSWORD / SEED_TOMY_PASSWORD se usan.
 * - Si no, se generan aleatorias por corrida y se muestran UNA vez por consola.
 * Los upserts de usuarios usan `update: {}`: jamás pisan hash/rol/estado
 * existentes (no reviven cuentas ni resetean passwords en corridas repetidas).
 */
function demoPassword(envName: string): { value: string; generated: boolean } {
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv) return { value: fromEnv, generated: false };
  return { value: crypto.randomBytes(12).toString("hex"), generated: true };
}

const demoCreds = demoPassword("SEED_DEMO_PASSWORD");
const tomyCreds = demoPassword("SEED_TOMY_PASSWORD");

async function main() {
  const plans = [
    { code: "mise_link" as const, name: "MISE LINK" },
    { code: "mise" as const, name: "MISE" },
    { code: "mise_restaurant" as const, name: "MISE RESTAURANT" },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {},
      create: { code: plan.code, name: plan.name, status: "active" },
    });
  }

  const passwordHash = await bcrypt.hash(demoCreds.value, 10);

  const platformOwner = await prisma.userProfile.upsert({
    where: { email: "owner@miseby.com" },
    update: {},
    create: {
      name: "Platform Owner",
      email: "owner@miseby.com",
      passwordHash,
      role: "platform_owner",
      status: "active",
    },
  });

  const businessOwner = await prisma.userProfile.upsert({
    where: { email: "negocio@miseby.com" },
    update: {},
    create: {
      name: "Business Owner",
      email: "negocio@miseby.com",
      passwordHash,
      role: "business_owner",
      status: "active",
    },
  });

  const businessMember = await prisma.userProfile.upsert({
    where: { email: "equipo@miseby.com" },
    update: {},
    create: {
      name: "Business Member",
      email: "equipo@miseby.com",
      passwordHash,
      role: "business_member",
      status: "active",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "negocio-demo" },
    update: {},
    create: {
      commercialName: "Negocio Demo",
      businessType: "other",
      country: "Colombia",
      slug: "negocio-demo",
      status: "active",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: businessOwner.id } },
    update: { role: "business_owner", status: "active" },
    create: {
      organizationId: organization.id,
      userId: businessOwner.id,
      role: "business_owner",
      status: "active",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: businessMember.id } },
    update: { role: "business_member", status: "active" },
    create: {
      organizationId: organization.id,
      userId: businessMember.id,
      role: "business_member",
      status: "active",
    },
  });

  // Cuenta demo con plan MISE LINK
  const tomyPasswordHash = await bcrypt.hash(tomyCreds.value, 10);
  const tomyOwner = await prisma.userProfile.upsert({
    where: { email: "tomy@gmail.com" },
    update: {},
    create: {
      name: "Tomy",
      email: "tomy@gmail.com",
      passwordHash: tomyPasswordHash,
      role: "business_owner",
      status: "active",
    },
  });

  const tomyOrg = await prisma.organization.upsert({
    where: { slug: "tomy-demo" },
    update: {},
    create: {
      commercialName: "Tomy Demo",
      businessType: "other",
      country: "Colombia",
      slug: "tomy-demo",
      status: "active",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: tomyOrg.id, userId: tomyOwner.id } },
    update: { role: "business_owner", status: "active" },
    create: {
      organizationId: tomyOrg.id,
      userId: tomyOwner.id,
      role: "business_owner",
      status: "active",
    },
  });

  const miseLinkPlan = await prisma.plan.findUniqueOrThrow({ where: { code: "mise_link" } });
  const tomyMembership = await prisma.membership.findFirst({
    where: { organizationId: tomyOrg.id },
  });
  if (!tomyMembership) {
    await prisma.membership.create({
      data: {
        organizationId: tomyOrg.id,
        planId: miseLinkPlan.id,
        status: "active",
        source: "internal",
        startsAt: new Date(),
        activatedById: platformOwner.id,
      },
    });
  }

  const misePlan = await prisma.plan.findUniqueOrThrow({ where: { code: "mise" } });
  const existingMembership = await prisma.membership.findFirst({
    where: { organizationId: organization.id },
  });
  if (!existingMembership) {
    await prisma.membership.create({
      data: {
        organizationId: organization.id,
        planId: misePlan.id,
        status: "active",
        source: "internal",
        startsAt: new Date(),
        activatedById: platformOwner.id,
      },
    });
  }

  console.log("[seed] demo lista (solo dev local).");
  console.log(
    `[seed] owner@miseby.com / negocio@miseby.com / equipo@miseby.com → ` +
      (demoCreds.generated ? `password generado: ${demoCreds.value}` : "password de SEED_DEMO_PASSWORD (cuentas nuevas)"),
  );
  console.log(
    `[seed] tomy@gmail.com → ` +
      (tomyCreds.generated ? `password generado: ${tomyCreds.value}` : "password de SEED_TOMY_PASSWORD (cuentas nuevas)"),
  );
  console.log("[seed] Las cuentas existentes NO se modifican (update vacío en usuarios).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
