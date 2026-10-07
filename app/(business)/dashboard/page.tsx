import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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

function formatDaysRemaining(trialEndsAt: Date | string) {
  const left = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
  );
  return left === 0 ? "Vence hoy" : left === 1 ? "1 día" : `${left} días`;
}

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

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#edf5f7] p-4 sm:p-6 lg:p-10">
          {error ? (
            <div className="mx-auto max-w-7xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : !org ? (
            <div className="mx-auto max-w-7xl rounded-3xl bg-[#0A2540] px-6 py-12 text-center text-white sm:px-10">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Todavía no hay un negocio en tu espacio</h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#d3e8ef]">
                No estás asociado a ningún negocio. Contacta a soporte si crees que esto es un error.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
              {(!hasMembership || !isActive) && <NoMembershipBanner orgStatus={org.status} />}

              <section className="overflow-hidden rounded-[1.5rem] bg-[#0A2540] text-white shadow-[0_18px_50px_-32px_rgba(10,37,64,0.75)]">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
                  <div className="flex min-h-[18rem] flex-col items-start justify-between gap-8 p-6 sm:p-9 lg:p-11">
                    <div>
                      <h1 className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-4xl lg:text-5xl">
                        {org.commercialName}
                      </h1>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#d3e8ef]">
                        <span>{orgRoleLabel(role)}</span>
                        <span aria-hidden className="h-1 w-1 rounded-full bg-[#1FD0FF]" />
                        <StatusBadge
                          label={ORG_STATUSES[org.status]?.label ?? org.status}
                          color={ORG_STATUSES[org.status]?.color}
                        />
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <Link
                        href="/dashboard/miselink"
                        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-[#0A2540] transition-colors hover:bg-[#dff7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FD0FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2540]"
                      >
                        Administrar Mise-Link
                        <span aria-hidden className="ml-3 text-lg leading-none">↗</span>
                      </Link>
                      {hasMiseLink && (
                        <a
                          href={`/${miseLinkHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FD0FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2540]"
                        >
                          Ver perfil público
                          <span className="sr-only"> (abre en otra pestaña)</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t border-white/15 bg-[#075296] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-8">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b8eafa]">Tu plan</p>
                      <p className="mt-3 font-display text-2xl font-semibold leading-tight">
                        {membership ? (PLAN_LABELS[membership.plan.code] ?? membership.plan.name) : "Sin plan asignado"}
                      </p>
                    </div>
                    <div className="mt-8 flex items-end justify-between gap-4 border-t border-white/20 pt-5">
                      <div>
                        <p className="text-xs text-[#c7e2f0]">Estado de cuenta</p>
                        <div className="mt-2">
                          {membership ? (
                            <StatusBadge
                              label={MEMBERSHIP_STATUSES[membership.status]?.label ?? membership.status}
                              color={MEMBERSHIP_STATUSES[membership.status]?.color}
                            />
                          ) : (
                            <span className="text-sm font-medium text-white">Pendiente de asignación</span>
                          )}
                        </div>
                      </div>
                      <span aria-hidden className="select-none font-display text-5xl font-semibold leading-none text-[#1FD0FF]">M</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:gap-10">
                <section aria-labelledby="business-details" className="min-w-0 px-1 sm:px-2">
                  <h2 id="business-details" className="font-display text-xl font-semibold tracking-tight text-[#0A2540] sm:text-2xl">
                    Datos de tu negocio
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">La información que identifica tu espacio en Miseby.</p>
                  <div className="mt-5 border-y border-[#c8dce3]">
                    <InfoRow label="Nombre" value={org.commercialName} />
                    <InfoRow label="Tipo de negocio" value={BUSINESS_TYPE_LABELS[org.businessType] ?? org.businessType} />
                    {org.city && <InfoRow label="Ciudad" value={org.city} />}
                    <InfoRow
                      label="Mise-Link"
                      value={
                        hasMiseLink ? (
                          <a href={`/${miseLinkHandle}`} target="_blank" rel="noreferrer" className="break-all font-medium text-[#075296] underline decoration-[#0E88E2]/50 underline-offset-4 hover:text-[#0E88E2]">
                            miseby.com/{miseLinkHandle}
                            <span className="sr-only"> (abre en otra pestaña)</span>
                          </a>
                        ) : (
                          <span className="break-all text-slate-500">miseby.com/{miseLinkHandle}</span>
                        )
                      }
                    />
                    {membership?.plan.code === "mise_restaurant" && (
                      <InfoRow
                        label="Mise-Restaurant"
                        value={<a href={`/menu/${org.slug}`} target="_blank" rel="noreferrer" className="break-all font-medium text-[#075296] underline decoration-[#0E88E2]/50 underline-offset-4 hover:text-[#0E88E2]">miseby.com/menu/{org.slug}<span className="sr-only"> (abre en otra pestaña)</span></a>}
                      />
                    )}
                    {membership?.plan.code === "mise" && (
                      <InfoRow
                        label="Mise-Catálogo"
                        value={<a href={`/catalogo/${org.slug}`} target="_blank" rel="noreferrer" className="break-all font-medium text-[#075296] underline decoration-[#0E88E2]/50 underline-offset-4 hover:text-[#0E88E2]">miseby.com/catalogo/{org.slug}<span className="sr-only"> (abre en otra pestaña)</span></a>}
                      />
                    )}
                    <InfoRow label="Mi rol" value={orgRoleLabel(role)} />
                  </div>
                </section>

                <section aria-labelledby="membership-details" className="rounded-2xl bg-[#dceef3] p-5 sm:p-7">
                  <h2 id="membership-details" className="font-display text-xl font-semibold tracking-tight text-[#0A2540]">
                    {membership && isActive ? "Tu membresía" : "Acceso a la plataforma"}
                  </h2>
                  <div className="mt-4 border-y border-[#b9d5df]">
                    {membership ? (
                      <>
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
                              value={formatDaysRemaining(membership.trialEndsAt)}
                            />
                          </>
                        )}
                      </>
                    ) : (
                      <p className="py-4 text-sm leading-6 text-slate-700">
                        Tu cuenta fue creada correctamente. Recibirás un correo cuando tu plan esté activo.
                      </p>
                    )}
                  </div>
                  {membership && !isActive && (
                    <p className="mt-4 text-sm leading-6 text-slate-700">
                      Tu plan está asignado y el negocio está esperando activación.
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
