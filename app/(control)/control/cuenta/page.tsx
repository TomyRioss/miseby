import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/control/account/change-password-form";

export const metadata: Metadata = { title: "Mi cuenta — MISE BY Control Center" };

export default async function AccountPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const profile = await prisma.userProfile.findUnique({ where: { id: sessionUser.id } });

  return (
    <div className="max-w-xl p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Mi cuenta</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">Información personal y seguridad.</p>

      <section className="mb-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Información personal</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-xs text-muted-foreground">Nombre</dt>
            <dd className="mt-0.5 text-sm font-medium">{profile?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Correo</dt>
            <dd className="mt-0.5 text-sm font-medium">{sessionUser.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rol</dt>
            <dd className="mt-0.5 text-sm font-medium">Platform Owner</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Cambiar contraseña</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
