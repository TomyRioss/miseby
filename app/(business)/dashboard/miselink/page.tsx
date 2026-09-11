import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { MiseLinkEditor } from "@/components/miselink/editor/miselink-editor";
import { NoPlanState } from "@/components/miselink/editor/no-plan-state";

export const metadata: Metadata = {
  title: "MISE LINK — MISE BY",
  description: "Panel MISE LINK del negocio.",
};

export default async function MiseLinkDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const page = await getOrCreateMiseLinkPage(user.id).catch((e) => {
    console.error("[miselink dashboard]", e);
    return null;
  });

  const editor = page ? (
    <MiseLinkEditor
      initial={{
        page: {
          username: page.username,
          displayName: page.displayName,
          bio: page.bio,
          avatarUrl: page.avatarUrl,
          showFollowers: page.showFollowers,
          published: page.published,
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
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BusinessHeader markSuffix="LINK" />
      <div className="flex flex-1">
        <BusinessSidebar userLabel={user.email} />
        <main className="flex-1">{editor}</main>
      </div>
    </div>
  );
}
