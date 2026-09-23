import type { Metadata } from "next";
import { getAccountDisplay, getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { EmailForm } from "@/components/business/account/email-form";
import { GoogleConnect } from "@/components/business/account/google-connect";
import { PasswordForm } from "@/components/business/account/password-form";
import { ProfileForm } from "@/components/business/account/profile-form";

export const metadata: Metadata = { title: "Ajustes | MISE BY" };

export default async function AjustesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const account = await getAccountDisplay().catch((e) => {
    console.error("[ajustes display]", e);
    return null;
  });
  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  try {
    data = await getOrganizationForMember(user.id);
  } catch (e) {
    console.error("[ajustes page]", e);
  }
  if (!data?.organization) {
    return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar tus ajustes.</div>;
  }

  const planCode = data.membership?.plan.code;
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={data.role} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-2xl">
            <h1 className="font-display text-2xl font-semibold">Ajustes</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Gestioná tu nombre, email, contraseña y conexiones.
            </p>
            <div className="grid gap-4">
              <ProfileForm initialName={account?.name ?? "Cuenta"} />
              <EmailForm currentEmail={account?.email ?? user.email ?? "-"} />
              <PasswordForm />
              {googleEnabled ? <GoogleConnect /> : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
