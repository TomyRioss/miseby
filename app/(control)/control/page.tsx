import type { Metadata } from "next";
import { Building2, CheckCircle2, Clock, CreditCard, Mail, Users } from "lucide-react";
import { getPlatformDashboardMetrics } from "@/lib/services/dashboard";
import { MetricCard } from "@/components/control/dashboard/metric-card";

export const metadata: Metadata = { title: "Inicio — MISE BY Control Center" };

export default async function ControlDashboardPage() {
  const metrics = await getPlatformDashboardMetrics();

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-2xl font-semibold text-foreground">Panel de control</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vista general de la plataforma.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total negocios" value={metrics.totalOrganizations} icon={Building2} color="blue" />
        <MetricCard label="Negocios activos" value={metrics.activeOrganizations} icon={CheckCircle2} color="green" />
        <MetricCard label="Negocios suspendidos" value={metrics.suspendedOrganizations} icon={Building2} color="red" />
        <MetricCard label="Negocios pendientes" value={metrics.pendingOrganizations} icon={Clock} color="amber" />
        <MetricCard label="Membresías activas" value={metrics.activeMemberships} icon={CreditCard} color="green" />
        <MetricCard label="Invitaciones pendientes" value={metrics.pendingInvitations} icon={Mail} color="amber" />
        <MetricCard label="Usuarios" value={metrics.totalUsers} icon={Users} color="blue" />
      </div>
    </div>
  );
}
