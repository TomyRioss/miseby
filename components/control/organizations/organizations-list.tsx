"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Building2, ExternalLink, AlertCircle, Settings } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { BUSINESS_TYPE_LABELS, ORG_STATUSES } from "@/lib/mise-labels";
import type { Organization } from "@prisma/client";

export function OrganizationsList({ organizations }: { organizations: Organization[] }) {
  const [search, setSearch] = useState("");

  const filtered = organizations.filter(
    (o) =>
      !search ||
      o.commercialName.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = filtered.filter((o) => o.status === "pending").length;

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Buscar por nombre o slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#0E88E2] focus:ring-2 focus:ring-[#1FD0FF]/30"
        />
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>{pendingCount}</strong> {pendingCount === 1 ? "negocio pendiente" : "negocios pendientes"} de
            activación. Asigná plan y activá desde el detalle del negocio.
          </p>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">{search ? "Sin resultados" : "Aún no hay negocios"}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((org) => {
              const status = ORG_STATUSES[org.status] || { label: org.status, color: "gray" };
              const isPending = org.status === "pending";
              return (
                <Link
                  key={org.id}
                  href={`/control/negocios/${org.id}`}
                  className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40 ${
                    isPending ? "bg-amber-50/60" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isPending ? "bg-amber-100" : "bg-[#075296]/10"
                    }`}
                  >
                    <Building2 className={`h-5 w-5 ${isPending ? "text-amber-600" : "text-[#075296]"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{org.commercialName}</p>
                    <p className="font-mono text-xs text-muted-foreground">/{org.slug}</p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
                    {BUSINESS_TYPE_LABELS[org.businessType] || org.businessType}
                  </div>
                  <StatusBadge label={status.label} color={status.color} className="shrink-0" />
                  {isPending ? (
                    <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white sm:flex">
                      <Settings className="h-3 w-3" /> Configurar
                    </span>
                  ) : (
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
