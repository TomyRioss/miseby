import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { normalizeTheme } from "@/lib/miselink/theme";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { DesignEditor } from "@/components/miselink/design/design-editor";

export const metadata: Metadata = {
  title: "Diseño | My MiseLink",
  description: "Personalizá theme, header, fondo, botones, texto, colores y footer.",
};

export default async function MiseLinkDesignPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const page = await getOrCreateMiseLinkPage(user.id).catch((e) => {
    console.error("[design page]", e);
    return null;
  });

  const planCode = await getOrganizationForMember(user.id)
    .then((d) => d?.membership?.plan.code)
    .catch((e) => {
      console.error("[design page plan]", e);
      return undefined;
    });

  if (!page) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <BusinessHeader markSuffix="LINK" />
        <div className="flex min-h-0 flex-1">
          <BusinessSidebar userLabel={user.email} hasMiseLink={false} planCode={planCode} />
          <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">No se pudo cargar el diseño.</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix="LINK" />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar userLabel={user.email} hasMiseLink planCode={planCode} />
        <main className="min-h-0 w-full flex-1 overflow-y-auto px-6 py-6 sm:px-10 lg:px-12 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">
            <DesignEditor
              username={page.username}
              initialTheme={normalizeTheme(page.theme)}
              page={{
                displayName: page.displayName,
                bio: page.bio,
                avatarUrl: page.avatarUrl,
              }}
              items={page.items
                .filter((i) => i.active)
                .map((i) => ({ id: i.id, title: i.title, url: i.url }))}
              socials={page.socials.map((s) => ({ id: s.id, network: s.network, url: s.url }))}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
