import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";

export const metadata: Metadata = {
  title: "Diseño — My MiseLink",
  description: "Plantillas de diseño para tu página de MiseLink.",
};

export default async function MiseLinkDesignPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BusinessHeader markSuffix="LINK" />
      <div className="flex flex-1">
        <BusinessSidebar userLabel={user.email} />
        <main className="flex-1 px-6 py-6 sm:px-10 lg:px-16 xl:px-24 lg:py-10">
          <h1 className="font-display text-2xl font-semibold text-foreground">Diseño</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí una plantilla para tu página de MiseLink.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            Próximamente: plantillas de diseño para elegir.
          </div>
        </main>
      </div>
    </div>
  );
}
