import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { MiseLinkEditor } from "@/components/miselink/editor/miselink-editor";
import { NoPlanState } from "@/components/miselink/editor/no-plan-state";

export const metadata: Metadata = {
  title: "MISE LINK | MISE BY",
  description: "Panel MISE LINK del negocio.",
};

export default async function MiseLinkDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const page = await getOrCreateMiseLinkPage(user.id).catch((e) => {
    console.error("[miselink dashboard]", e);
    return null;
  });

  const membership = await getOrganizationForMember(user.id).catch((e) => {
    console.error("[miselink dashboard plan]", e);
    return null;
  });
  const planCode = membership?.membership?.plan.code;
  const orgSlug = membership?.organization?.slug;
  const orgRole = membership?.role;

  const editor = page ? (
    <MiseLinkEditor
      planCode={planCode}
      orgSlug={orgSlug}
      initial={{
        page: {
          username: page.username,
          displayName: page.displayName,
          bio: page.bio,
          avatarUrl: page.avatarUrl,
          showFollowers: page.showFollowers,
          published: page.published,
          theme: page.theme,
        },
        items: page.items,
        socials: page.socials,
      }}
    />
  ) : (
    <div className="px-6 py-6 sm:px-10 lg:px-16 xl:px-24 lg:py-10">
      <NoPlanState />
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix="LINK" />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={Boolean(page)} planCode={planCode} orgRole={orgRole} />
        <main className="min-h-0 flex-1 overflow-y-auto">{editor}</main>
      </div>
    </div>
  );
}
