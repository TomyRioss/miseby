"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  MEMBERSHIP_SOURCE_LABELS,
  MEMBERSHIP_STATUSES,
  PLAN_LABELS,
  formatDate,
} from "@/lib/mise-labels";
import { createMembershipAction, updateMembershipAction } from "@/lib/actions/memberships";
import type { Membership, MembershipSource, MembershipStatus, Plan } from "@prisma/client";

type MembershipWithPlan = Membership & { plan: Plan };

const STATUS_OPTIONS: MembershipStatus[] = ["pending", "trial", "active", "suspended", "expired", "cancelled"];

export function OrganizationMemberships({
  organizationId,
  memberships,
  plans,
}: {
  organizationId: string;
  memberships: MembershipWithPlan[];
  plans: Plan[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [status, setStatus] = useState<MembershipStatus>("active");
  const [source, setSource] = useState<MembershipSource>("manual");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await createMembershipAction({
        organizationId,
        planId,
        status,
        source,
        startsAt: startsAt || undefined,
        expiresAt: expiresAt || undefined,
        trialEndsAt: trialEndsAt || undefined,
        internalNotes: internalNotes || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Membresía creada");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear membresía");
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = async (id: string, next: MembershipStatus) => {
    try {
      const result = await updateMembershipAction(id, { status: next });
      if (!result.ok) toast.error(result.error);
      else toast.success("Membresía actualizada");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar membresía");
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display font-semibold">Membresías</h2>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="flex items-center gap-1.5 text-sm text-[#0E88E2] hover:underline"
        >
          <Plus className="h-4 w-4" /> Nueva membresía
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-5 space-y-3 rounded-xl border border-border bg-muted/40 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Plan *</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{PLAN_LABELS[p.code] || p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MembershipStatus)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{MEMBERSHIP_STATUSES[s]?.label || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as MembershipSource)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MEMBERSHIP_SOURCE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Inicio</Label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimiento</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin trial</Label>
              <Input type="date" value={trialEndsAt} onChange={(e) => setTrialEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas internas</Label>
            <Input value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} size="sm" className="bg-[#075296] text-white hover:bg-[#0E88E2]">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Crear
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin membresías registradas.</p>
      ) : (
        <div className="space-y-3">
          {memberships.map((mb) => {
            const mbStatus = MEMBERSHIP_STATUSES[mb.status] || { label: mb.status, color: "gray" };
            const planName = PLAN_LABELS[mb.plan.code] || mb.plan.name;
            return (
              <div key={mb.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-semibold">{planName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {MEMBERSHIP_SOURCE_LABELS[mb.source] || mb.source}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={mbStatus.label} color={mbStatus.color} />
                    {mb.status !== "active" && (
                      <button
                        onClick={() => updateStatus(mb.id, "active")}
                        className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700 transition-colors hover:bg-green-100"
                      >
                        Activar
                      </button>
                    )}
                    {mb.status === "active" && (
                      <button
                        onClick={() => updateStatus(mb.id, "suspended")}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 transition-colors hover:bg-red-100"
                      >
                        Suspender
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>Inicio: {formatDate(mb.startsAt)}</span>
                  <span>Vence: {formatDate(mb.expiresAt)}</span>
                  <span>Trial hasta: {formatDate(mb.trialEndsAt)}</span>
                </div>
                {mb.internalNotes && <p className="mt-1 text-xs text-muted-foreground">{mb.internalNotes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
