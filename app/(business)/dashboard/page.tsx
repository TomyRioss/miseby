import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, CreditCard, CheckCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/status-badge";
import { InfoRow } from "@/components/business/info-row";
import { NoMembershipBanner } from "@/components/business/no-membership-banner";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { orgRoleLabel } from "@/components/business/members/role-labels";
import { BUSINESS_TYPE_LABELS, ORG_STATUSES, MEMBERSHIP_STATUSES, PLAN_LABELS, formatDate } from "@/lib/mise-labels";

export const metadata: Metadata = {
  title: "Mi negocio | MISE BY",
  description: "Panel del negocio en MISE BY.",
};

export default async function BusinessDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  let error: string | null = null;

  try {
    data = await getOrganizationForMember(user.id);
  } catch {
    error = "No pudimos cargar la información de tu negocio.";
  }

  const org = data?.organization;
  const membership = data?.membership;
  const role = data?.role;
  const hasMembership = Boolean(membership);
  const isActive = org?.status === "active";
  const planSuffix = membership ? (PLAN_LABELS[membership.plan.code] ?? membership.plan.name) : undefined;
  const hasMiseLink =
    (membership?.plan.code === "mise_link" ||
      membership?.plan.code === "mise" ||
      membership?.plan.code === "mise_restaurant") &&
    (membership.status === "active" || membership.status === "trial");

  // TOM-161: username real de MISE LINK (solo lectura, sin crear la página).
  let miseLinkUsername: string | null = null;
  if (org) {
    try {
      const page = await prisma.miseLinkPage.findUnique({
        where: { organizationId: org.id },
        select: { username: true },
      });
      miseLinkUsername = page?.username ?? null;
    } catch {
      miseLinkUsername = null;
    }
  }
  const miseLinkHandle = miseLinkUsername ?? org?.slug ?? "";

  // TOM-193: business_member no accede a Vista general → contenido del catálogo según plan.
  if (role === "business_member") {
    redirect(membership?.plan.code === "mise_restaurant" ? "/dashboard/menu" : "/dashboard/catalogo");
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader markSuffix={planSuffix} />

      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={hasMiseLink} planCode={membership?.plan.code} orgRole={role} />

        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : !org ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              <Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No estás asociado a ningún negocio todavía.</p>
              <p className="mt-1 text-xs opacity-70">Contacta a soporte si crees que esto es un error.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-semibold text-foreground">
                  {org.commercialName}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  {orgRoleLabel(role)}
                  <StatusBadge
                    label={ORG_STATUSES[org.status]?.label ?? org.status}
                    color={ORG_STATUSES[org.status]?.color}
                  />
                </p>
              </div>

              {(!hasMembership || !isActive) && (
                <div className="mb-6">
                  <NoMembershipBanner orgStatus={org.status} />
                </div>
              )}

              {hasMembership && isActive && membership ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-[#075296]/10 p-2.5">
                        <Building2 className="h-5 w-5 text-[#075296]" />
                      </div>
                      <h2 className="font-display font-semibold">Información del negocio</h2>
                    </div>
                    <InfoRow label="Nombre" value={org.commercialName} />
                    <InfoRow label="Tipo" value={BUSINESS_TYPE_LABELS[org.businessType] ?? org.businessType} />
                    <InfoRow
                      label="Mise-Link"
                      value={
                        <a
                          href={`/${miseLinkHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-[#075296] underline underline-offset-2"
                        >
                          miseby.com/{miseLinkHandle}
                        </a>
                      }
                    />
                    <InfoRow
                      label="Mise-Restaurant"
                      value={
                        <a
                          href={`/menu/${org.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-[#075296] underline underline-offset-2"
                        >
                          miseby.com/menu/{org.slug}
                        </a>
                      }
                    />
                    {org.city && <InfoRow label="Ciudad" value={org.city} />}
                    <InfoRow label="Mi rol" value={orgRoleLabel(role)} />
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="rounded-xl bg-[#075296]/10 p-2.5">
                        <CreditCard className="h-5 w-5 text-[#075296]" />
                      </div>
                      <h2 className="font-display font-semibold">Plan activo</h2>
                    </div>
                    <InfoRow label="Plan" value={PLAN_LABELS[membership.plan.code] ?? membership.plan.name} />
                    <InfoRow
                      label="Estado"
                      value={
                        <StatusBadge
                          label={MEMBERSHIP_STATUSES[membership.status]?.label ?? membership.status}
                          color={MEMBERSHIP_STATUSES[membership.status]?.color}
                        />
                      }
                    />
                    {membership.startsAt && <InfoRow label="Inicio" value={formatDate(membership.startsAt)} />}
                    {membership.expiresAt && <InfoRow label="Vence" value={formatDate(membership.expiresAt)} />}
                    {membership.trialEndsAt && (
                      <>
                        <InfoRow label="Trial hasta" value={formatDate(membership.trialEndsAt)} />
                        <InfoRow
                          label="Días restantes"
                          value={(() => {
                            const left = Math.max(
                              0,
                              Math.ceil((new Date(membership.trialEndsAt).getTime() - Date.now()) / 86400000),
                            );
                            return left === 0 ? "Vence hoy" : left === 1 ? "1 día" : `${left} días`;
                          })()}
                        />
                      </>
                    )}
                  </section>
                </div>
              ) : hasMembership && !isActive && membership ? (
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-[#075296]/10 p-2.5">
                      <CreditCard className="h-5 w-5 text-[#075296]" />
                    </div>
                    <h2 className="font-display font-semibold">Plan asignado</h2>
                  </div>
                  <InfoRow label="Plan" value={PLAN_LABELS[membership.plan.code] ?? membership.plan.name} />
                  <InfoRow
                    label="Estado"
                    value={
                      <StatusBadge
                        label={MEMBERSHIP_STATUSES[membership.status]?.label ?? membership.status}
                        color={MEMBERSHIP_STATUSES[membership.status]?.color}
                      />
                    }
                  />
                  <p className="mt-4 text-xs text-muted-foreground">
                    Tu plan está asignado pero esperando activación del negocio.
                  </p>
                </div>
              ) : null}

              {!hasMembership && (
                <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-[#075296]/10 p-2.5">
                      <Building2 className="h-5 w-5 text-[#075296]" />
                    </div>
                    <h2 className="font-display font-semibold">Tu negocio</h2>
                  </div>
                  <InfoRow label="Nombre" value={org.commercialName} />
                  <InfoRow
                    label="Mise-Link"
                    value={
                      <a
                        href={`/${miseLinkHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-[#075296] underline underline-offset-2"
                      >
                        miseby.com/{miseLinkHandle}
                      </a>
                    }
                  />
                  <InfoRow
                    label="Mise-Restaurant"
                    value={
                      <a
                        href={`/menu/${org.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-[#075296] underline underline-offset-2"
                      >
                        miseby.com/menu/{org.slug}
                      </a>
                    }
                  />
                  {org.city && <InfoRow label="Ciudad" value={org.city} />}
                  <InfoRow
                    label="Estado del negocio"
                    value={
                      <StatusBadge
                        label={org.status === "pending" ? "Pendiente en revisión" : ORG_STATUSES[org.status]?.label ?? org.status}
                        color={ORG_STATUSES[org.status]?.color}
                      />
                    }
                  />
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#075296]/5 px-4 py-3">
                    <CheckCircle className="h-4 w-4 shrink-0 text-[#075296]" />
                    <p className="text-xs text-[#075296]">
                      Tu cuenta fue creada correctamente. Recibirás un correo cuando tu plan esté activo.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
