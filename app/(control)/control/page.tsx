import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/ui/count-up";
import { LiveRefresh } from "@/components/control/dashboard/live-refresh";
import { getPlatformDashboardMetrics } from "@/lib/services/dashboard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inicio | MISE BY Control Center" };

const ACTION_LABELS: Record<string, string> = {
  organization_created: "Negocio creado",
  organization_updated: "Negocio editado",
  organization_activated: "Negocio activado",
  organization_suspended: "Negocio suspendido",
  organization_cancelled: "Negocio cancelado",
  membership_created: "Membresía creada",
  membership_changed: "Membresía modificada",
  membership_activated: "Membresía activada",
  membership_suspended: "Membresía suspendida",
  membership_cancelled: "Membresía cancelada",
  invitation_created: "Invitación enviada",
  invitation_resent: "Invitación reenviada",
  invitation_cancelled: "Invitación cancelada",
  invitation_accepted: "Invitación aceptada",
  user_password_changed: "Contraseña cambiada",
  platform_owner_login: "Inicio de sesión",
};

function StatusRow({
  href,
  label,
  value,
  tone,
}: {
  href: string;
  label: string;
  value: number;
  tone: "green" | "amber" | "red";
}) {
  const colors = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
  };

  return (
    <Link
      href={href}
      className="group flex min-h-14 items-center justify-between gap-4 border-t border-border/70 py-3 first:border-0 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 items-center gap-3 text-sm text-foreground">
        <span className={`h-2 w-2 shrink-0 rounded-full ${colors[tone]}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          <CountUp value={value} />
        </span>
      </span>
    </Link>
  );
}

function BaseMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-4 sm:py-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        <CountUp value={value} />
      </p>
    </div>
  );
}

export default async function ControlDashboardPage() {
  const [metrics, recentActivities] = await Promise.all([
    getPlatformDashboardMetrics(),
    prisma.auditLog
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          action: true,
          createdAt: true,
          actorUser: { select: { name: true, email: true } },
          organization: { select: { id: true, commercialName: true } },
        },
      })
      .then((activities) => ({ activities, error: false as const }))
      .catch((error: unknown) => {
        console.error("No se pudo cargar la actividad reciente del panel de control.", error);
        return { activities: [], error: true as const };
      }),
  ]);
  const activityError = recentActivities.error;
  const pendingTotal = metrics.pendingOrganizations + metrics.pendingInvitations;

  return (
    <div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-10">
      <header className="flex flex-col gap-5 border-b border-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Control de plataforma
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Actividad, estado de negocios y accesos en un solo lugar.
          </p>
        </div>
        <LiveRefresh />
      </header>

      <div className="grid gap-6 py-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(310px,0.8fr)] xl:gap-8">
        <section aria-labelledby="activity-title" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="activity-title" className="text-lg font-semibold tracking-tight text-foreground">
                Actividad reciente
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Últimos movimientos registrados en la plataforma.</p>
            </div>
            <Link
              href="/control/auditoria"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver todos
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {activityError ? (
              <div className="px-5 py-9 text-center sm:py-12">
                <p className="text-sm font-medium text-foreground">No se pudo cargar la actividad</p>
                <p className="mt-1 text-sm text-muted-foreground">Abrí el registro para volver a consultar los movimientos.</p>
                <Link
                  href="/control/auditoria"
                  className="mt-3 inline-flex min-h-9 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Abrir auditoría
                </Link>
              </div>
            ) : recentActivities.activities.length > 0 ? (
              <ol className="divide-y divide-border/70">
                {recentActivities.activities.map((activity) => {
                  const actor = activity.actorUser?.name || activity.actorUser?.email || "Usuario desconocido";
                  const occurredAt = new Date(activity.createdAt);

                  return (
                    <li key={activity.id} className="flex min-w-0 items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {ACTION_LABELS[activity.action] || activity.action}
                        </p>
                        <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">
                          <span>{actor}</span>
                          {activity.organization && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <Link
                                href={`/control/negocios/${activity.organization.id}`}
                                className="rounded-sm underline decoration-border underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {activity.organization.commercialName}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                      <time
                        dateTime={occurredAt.toISOString()}
                        className="shrink-0 pt-0.5 text-right text-[11px] tabular-nums text-muted-foreground sm:text-xs"
                      >
                        {occurredAt.toLocaleString("es-AR", {
                          timeZone: "America/Argentina/Buenos_Aires",
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="px-5 py-9 text-center sm:py-12">
                <p className="text-sm font-medium text-foreground">Todavía no hay movimientos</p>
                <p className="mt-1 text-sm text-muted-foreground">Las acciones registradas aparecerán aquí.</p>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="business-status-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="business-status-title" className="text-lg font-semibold tracking-tight text-foreground">
                Estado de negocios
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{metrics.totalOrganizations} en total</p>
            </div>
            <Link
              href="/control/negocios"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ver negocios
            </Link>
          </div>
          <div>
            <StatusRow href="/control/negocios" label="Activos" value={metrics.activeOrganizations} tone="green" />
            <StatusRow href="/control/negocios" label="Pendientes" value={metrics.pendingOrganizations} tone="amber" />
            <StatusRow href="/control/negocios" label="Suspendidos" value={metrics.suspendedOrganizations} tone="red" />
          </div>
        </section>
      </div>

      <section aria-labelledby="attention-title" className="border-t border-border/80 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="attention-title" className="text-lg font-semibold tracking-tight text-foreground">
              {pendingTotal > 0 ? "Pendientes de atención" : "Seguimiento"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingTotal > 0
                ? `${pendingTotal} elementos esperan una revisión.`
                : "No hay negocios ni invitaciones pendientes."}
            </p>
          </div>
        </div>
        <div className="mt-4 grid divide-y divide-border/70 rounded-2xl border border-border bg-card px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6">
          <div className="sm:pr-6">
            <StatusRow href="/control/negocios" label="Negocios pendientes" value={metrics.pendingOrganizations} tone="amber" />
          </div>
          <div className="sm:pl-6">
            <StatusRow href="/control/invitaciones" label="Invitaciones pendientes" value={metrics.pendingInvitations} tone="amber" />
          </div>
        </div>
      </section>

      <section aria-labelledby="platform-base-title" className="mt-6 border-t border-border/80 pt-6">
        <h2 id="platform-base-title" className="text-lg font-semibold tracking-tight text-foreground">
          Base de plataforma
        </h2>
        <div className="mt-2 grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="sm:pr-6"><BaseMetric label="Membresías activas" value={metrics.activeMemberships} /></div>
          <div className="sm:pl-6"><BaseMetric label="Usuarios registrados" value={metrics.totalUsers} /></div>
        </div>
      </section>
    </div>
  );
}
