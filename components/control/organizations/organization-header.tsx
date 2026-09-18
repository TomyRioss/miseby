"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/control/confirm-button";
import { ORG_STATUSES } from "@/lib/mise-labels";
import { setOrganizationStatusAction } from "@/lib/actions/organizations";
import type { Organization, OrganizationStatus } from "@prisma/client";

export function OrganizationHeader({ organization }: { organization: Organization }) {
  const [busy, setBusy] = useState(false);
  const status = ORG_STATUSES[organization.status] || { label: organization.status, color: "gray" };

  const changeStatus = async (next: OrganizationStatus) => {
    setBusy(true);
    try {
      const result = await setOrganizationStatusAction(organization.id, { status: next });
      if (!result.ok) toast.error(result.error);
      else toast.success("Estado actualizado");
    } catch (err) {
      console.error(err);
      toast.error("Error al cambiar estado");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link
        href="/control/negocios"
        className="cursor-pointer mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a negocios
      </Link>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{organization.commercialName}</h1>
          <p className="font-mono text-sm text-muted-foreground">miseby.com/{organization.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge label={status.label} color={status.color} />
          {organization.status !== "active" && (
            <ConfirmButton title='¿Cambiar estado a "active"?' onConfirm={() => changeStatus("active")}>
              <Button variant="outline" size="sm" disabled={busy} className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100">
                Activar
              </Button>
            </ConfirmButton>
          )}
          {organization.status === "active" && (
            <ConfirmButton title='¿Cambiar estado a "suspended"?' onConfirm={() => changeStatus("suspended")}>
              <Button variant="outline" size="sm" disabled={busy} className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                Suspender
              </Button>
            </ConfirmButton>
          )}
          {organization.status !== "cancelled" && (
            <ConfirmButton title='¿Cambiar estado a "cancelled"?' onConfirm={() => changeStatus("cancelled")}>
              <Button variant="outline" size="sm" disabled={busy}>
                Cancelar
              </Button>
            </ConfirmButton>
          )}
        </div>
      </div>
    </>
  );
}
