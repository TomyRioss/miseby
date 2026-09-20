import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { listOrgMembers } from "@/lib/actions/members";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { MembersManager } from "@/components/business/members/members-manager";

export const metadata: Metadata = { title: "Miembros | MISE BY" };

function catalogHref(planCode: string | undefined): string {
  return planCode === "mise_restaurant" ? "/dashboard/menu" : "/dashboard/catalogo";
}

export default async function MiembrosPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  try {
    data = await getOrganizationForMember(user.id);
  } catch (e) {
    console.error("[miembros page]", e);
  }
  if (!data?.organization) {
    return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar tu negocio.</div>;
  }

  const planCode = data.membership?.plan.code;
  const role = data.role;
  // TOM-193: solo owner + admin. Member va al contenido del catálogo según plan.
  if (role !== "business_owner" && role !== "business_admin") {
    redirect(catalogHref(planCode));
  }

  const result = await listOrgMembers(data.organization.id).catch((e) => {
    console.error("[miembros list]", e);
    return { ok: false as const, error: "No pudimos cargar los miembros." };
  });
  const loaded = result.ok && "members" in result ? result : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={role} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-4xl">
            <h1 className="font-display text-2xl font-semibold">Miembros</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Invitá a tu equipo y gestioná roles y accesos.
            </p>
            {!loaded ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {"error" in result ? result.error : "No pudimos cargar los miembros."}
              </div>
            ) : (
              <MembersManager
                actorRole={role as "business_owner" | "business_admin"}
                orgId={data.organization.id}
                initialMembers={loaded.members.map((m) => ({
                  id: m.id,
                  userId: m.userId,
                  role: m.role,
                  status: m.status,
                  user: m.user,
                  isSelf: m.userId === user.id,
                }))}
                initialInvitations={loaded.invitations}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
