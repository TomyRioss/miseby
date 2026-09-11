import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ponytail: demo credentials, plain constant. Mirror any change in docs/CREDENTIALS.md.
const DEMO_PASSWORD = "Miseby2026!";

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

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const platformOwner = await prisma.userProfile.upsert({
    where: { email: "owner@miseby.com" },
    update: { passwordHash, role: "platform_owner", status: "active" },
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
    update: { passwordHash, role: "business_owner", status: "active" },
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
    update: { passwordHash, role: "business_member", status: "active" },
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
  const tomyPasswordHash = await bcrypt.hash("tomy1234", 10);
  const tomyOwner = await prisma.userProfile.upsert({
    where: { email: "tomy@gmail.com" },
    update: { passwordHash: tomyPasswordHash, role: "business_owner", status: "active" },
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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
