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
          published: page.published,
        },
        items: page.items,
        socials: page.socials,
      }}
    />
  ) : (
    <NoPlanState />
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BusinessHeader userLabel={user.email} />
      <div className="flex flex-1">
        <BusinessSidebar />
        <main className="flex-1 p-6 lg:p-10">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-foreground">MISE LINK</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tu página de enlaces pública.</p>
          </div>
          {editor}
        </main>
      </div>
    </div>
  );
}
