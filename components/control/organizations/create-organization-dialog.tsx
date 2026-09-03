"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { organizationSchema, type OrganizationInput } from "@/lib/validations/mise";
import { createOrganizationAction } from "@/lib/actions/organizations";
import { BUSINESS_TYPE_LABELS } from "@/lib/mise-labels";
import { COUNTRIES } from "@/lib/countries";

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { businessType: "restaurant", country: "CO" },
  });

  const businessType = watch("businessType");
  const country = watch("country");

  const onSubmit = async (data: OrganizationInput) => {
    try {
      const result = await createOrganizationAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Negocio creado");
      reset();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear negocio");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#075296] text-white hover:bg-[#0E88E2]">
          <Plus className="h-4 w-4" /> Crear negocio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear negocio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre comercial *</Label>
            <Input {...register("commercialName")} />
            {errors.commercialName && (
              <p className="text-xs text-destructive">{errors.commercialName.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo de negocio *</Label>
              <Select value={businessType} onValueChange={(v) => setValue("businessType", v as OrganizationInput["businessType"])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BUSINESS_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Input {...register("city")} />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input {...register("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email del negocio</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div className="space-y-1.5">
            <Label>Notas internas</Label>
            <Textarea rows={2} {...register("internalNotes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#075296] text-white hover:bg-[#0E88E2]">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear negocio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
