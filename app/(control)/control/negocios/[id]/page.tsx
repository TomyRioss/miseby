import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrganizationHeader } from "@/components/control/organizations/organization-header";
import { OrganizationInfo } from "@/components/control/organizations/organization-info";
import { OrganizationMembers } from "@/components/control/organizations/organization-members";
import { OrganizationMemberships } from "@/components/control/organizations/organization-memberships";
import { OrganizationInvitations } from "@/components/control/organizations/organization-invitations";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [organization, members, memberships, invitations, plans] = await Promise.all([
    prisma.organization.findUnique({ where: { id } }),
    prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.membership.findMany({
      where: { organizationId: id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invitation.findMany({ where: { organizationId: id }, orderBy: { createdAt: "desc" } }),
    prisma.plan.findMany({ orderBy: { code: "asc" } }),
  ]);

  if (!organization) notFound();

  return (
    <div className="max-w-4xl p-6 lg:p-10">
      <OrganizationHeader organization={organization} />
      <OrganizationInfo organization={organization} />
      <OrganizationMembers organizationId={id} members={members} />
      <OrganizationMemberships organizationId={id} memberships={memberships} plans={plans} />
      <OrganizationInvitations organizationId={id} invitations={invitations} />
    </div>
  );
}
