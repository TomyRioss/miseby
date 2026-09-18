"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { organizationSchema, type OrganizationInput } from "@/lib/validations/mise";
import { updateOrganizationAction } from "@/lib/actions/organizations";
import { BUSINESS_TYPE_LABELS, formatDate } from "@/lib/mise-labels";
import { COUNTRIES } from "@/lib/countries";
import type { Organization } from "@prisma/client";

export function OrganizationInfo({ organization }: { organization: Organization }) {
  const [editMode, setEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      commercialName: organization.commercialName,
      legalName: organization.legalName ?? "",
      taxId: organization.taxId ?? "",
      businessType: organization.businessType,
      country: organization.country ?? "CO",
      city: organization.city ?? "",
      address: organization.address ?? "",
      phone: organization.phone ?? "",
      email: organization.email ?? "",
      currency: organization.currency ?? "",
      timezone: organization.timezone ?? "",
      internalNotes: organization.internalNotes ?? "",
    },
  });

  const businessType = watch("businessType");
  const country = watch("country");

  const onSubmit = async (data: OrganizationInput) => {
    try {
      const result = await updateOrganizationAction(organization.id, data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Información actualizada");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar");
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display font-semibold">Información del negocio</h2>
        {!editMode && (
          <button onClick={() => setEditMode(true)} className="cursor-pointer text-sm text-[#0E88E2] hover:underline">
            Editar
          </button>
        )}
      </div>

      {editMode ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre comercial *</Label>
              <Input {...register("commercialName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre legal</Label>
              <Input {...register("legalName")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>NIT / Tax ID</Label>
              <Input {...register("taxId")} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de negocio</Label>
              <Select value={businessType} onValueChange={(v) => setValue("businessType", v as OrganizationInput["businessType"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>País</Label>
              <Select value={country} onValueChange={(v) => setValue("country", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input {...register("city")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input {...register("address")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Input placeholder="COP / USD" {...register("currency")} />
            </div>
            <div className="space-y-1.5">
              <Label>Zona horaria</Label>
              <Input placeholder="America/Bogota" {...register("timezone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea rows={2} {...register("internalNotes")} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="bg-[#075296] text-white hover:bg-[#0E88E2]">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            ["Nombre comercial", organization.commercialName],
            ["Nombre legal", organization.legalName || "-"],
            ["NIT / Tax ID", organization.taxId || "-"],
            ["Tipo", BUSINESS_TYPE_LABELS[organization.businessType] || organization.businessType],
            ["País", organization.country || "-"],
            ["Ciudad", organization.city || "-"],
            ["Dirección", organization.address || "-"],
            ["Teléfono", organization.phone || "-"],
            ["Email", organization.email || "-"],
            ["Moneda", organization.currency || "-"],
            ["Zona horaria", organization.timezone || "-"],
            ["Creado", formatDate(organization.createdAt)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">{v}</dd>
            </div>
          ))}
          {organization.internalNotes && (
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Notas internas</dt>
              <dd className="mt-0.5 text-sm text-foreground">{organization.internalNotes}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
