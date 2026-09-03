import "server-only";
import { prisma } from "@/lib/prisma";

export async function getPlatformDashboardMetrics() {
  const [
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    pendingOrganizations,
    activeMemberships,
    pendingInvitations,
    totalUsers,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "active" } }),
    prisma.organization.count({ where: { status: "suspended" } }),
    prisma.organization.count({ where: { status: "pending" } }),
    prisma.membership.count({ where: { status: { in: ["active", "trial"] } } }),
    prisma.invitation.count({ where: { status: "pending" } }),
    prisma.userProfile.count({ where: { role: { not: "platform_owner" } } }),
  ]);

  return {
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    pendingOrganizations,
    activeMemberships,
    pendingInvitations,
    totalUsers,
  };
}
