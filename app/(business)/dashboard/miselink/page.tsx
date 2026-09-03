import type { Metadata } from "next";
import { Link2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";

export const metadata: Metadata = {
  title: "MISE LINK — MISE BY",
  description: "Panel MISE LINK del negocio.",
};

// ponytail: placeholder. Reemplazar por dashboard MISE LINK real cuando exista diseño.
export default async function MiseLinkDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <BusinessHeader userLabel={user.email} />

      <div className="flex flex-1">
        <BusinessSidebar />

        <main className="flex-1 p-6 lg:p-10">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-foreground">MISE LINK</h1>
            <p className="mt-1 text-sm text-muted-foreground">Panel del plan MISE LINK.</p>
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <div className="mx-auto mb-4 w-fit rounded-xl bg-[#075296]/10 p-3">
              <Link2 className="h-6 w-6 text-[#075296]" />
            </div>
            <p className="text-sm font-medium text-foreground">Dashboard MISE LINK en construcción</p>
            <p className="mt-1 text-xs">Esta vista es un placeholder. El diseño real llega pronto.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
