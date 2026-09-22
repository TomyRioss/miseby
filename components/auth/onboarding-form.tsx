"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { updateBusinessProfileAction, saveRestaurantHoursAction } from "@/lib/actions/restaurant";
import { updateUsernameAction, updateProfileAction } from "@/lib/actions/miselink";
import {
  defaultSchedule,
  formatScheduleToText,
  parseSchedule,
  scheduleSummary,
  type WeekSchedule,
} from "@/lib/restaurant-theme";
import { ScheduleDialog } from "@/components/business/restaurant/schedule-dialog";

export type OnboardingPlanCode = "mise_link" | "mise" | "mise_restaurant";

export interface OnboardingInitial {
  commercialName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  username: string;
  bio: string;
  hours: string;
  whatsapp: string;
  schedule?: WeekSchedule | null;
}

interface OnboardingFormProps {
  planCode: OnboardingPlanCode;
  initial: OnboardingInitial;
}

const inputCls =
  "rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40";

const PLAN_TITLE: Record<OnboardingPlanCode, string> = {
  mise_link: "Configurá tu Mise Link",
  mise: "Configurá tu negocio",
  mise_restaurant: "Configurá tu restaurante",
};

export function OnboardingForm({ planCode, initial }: OnboardingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [schedule, setSchedule] = useState<WeekSchedule>(() => parseSchedule(initial.schedule) ?? defaultSchedule());
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInitial>({ defaultValues: initial });

  const onSubmit = async (values: OnboardingInitial) => {
    setServerError("");
    try {
      const base = await updateBusinessProfileAction({
        commercialName: values.commercialName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
      });
      if (!base.ok) {
        setServerError(base.error);
        toast.error(base.error);
        return;
      }

      if (planCode === "mise_link") {
        const username = values.username.trim().toLowerCase();
        if (username && username !== initial.username) {
          const r = await updateUsernameAction(username);
          if (!r.ok) {
            setServerError(r.error);
            toast.error(r.error);
            return;
          }
        }
        const r2 = await updateProfileAction({ bio: values.bio.trim() });
        if (!r2.ok) {
          setServerError(r2.error);
          toast.error(r2.error);
          return;
        }
      }

      if (planCode === "mise_restaurant" || planCode === "mise") {
        const r3 = await saveRestaurantHoursAction({
          hours: planCode === "mise_restaurant" ? formatScheduleToText(schedule) : values.hours.trim(),
          whatsapp: values.whatsapp.trim(),
          ...(planCode === "mise_restaurant" ? { schedule } : {}),
        });
        if (!r3.ok) {
          setServerError(r3.error);
          toast.error(r3.error);
          return;
        }
      }

      toast.success("¡Listo! Tu negocio está configurado.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("No se pudo guardar. Intentá de nuevo.");
      toast.error("No se pudo guardar. Intentá de nuevo.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 w-full max-w-lg space-y-8">
      <FieldGroup>
        <h2 className="text-base font-semibold text-foreground">Datos de tu negocio</h2>

        <Field data-invalid={Boolean(errors.commercialName)}>
          <FieldLabel htmlFor="commercialName">Nombre del negocio</FieldLabel>
          <Input id="commercialName" className={inputCls} {...register("commercialName", { required: "Requerido", minLength: { value: 2, message: "Mínimo 2 caracteres" } })} />
          {errors.commercialName && <FieldError errors={[{ message: errors.commercialName.message }]} />}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="phone">Teléfono / WhatsApp</FieldLabel>
            <Input id="phone" autoComplete="tel" placeholder="+57 300 123 4567" className={inputCls} {...register("phone", { required: "Requerido" })} />
            {errors.phone && <FieldError errors={[{ message: errors.phone.message }]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email de contacto</FieldLabel>
            <Input id="email" type="email" placeholder="hola@minegocio.com" className={inputCls} {...register("email")} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.city)}>
            <FieldLabel htmlFor="city">Ciudad</FieldLabel>
            <Input id="city" autoComplete="address-level2" className={inputCls} {...register("city", { required: "Requerido" })} />
            {errors.city && <FieldError errors={[{ message: errors.city.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.address)}>
            <FieldLabel htmlFor="address">Dirección</FieldLabel>
            <Input id="address" autoComplete="street-address" placeholder="Calle 123 #45-67" className={inputCls} {...register("address", { required: "Requerido" })} />
            {errors.address && <FieldError errors={[{ message: errors.address.message }]} />}
          </Field>
        </div>
      </FieldGroup>

      {planCode === "mise_link" && (
        <FieldGroup>
          <h2 className="text-base font-semibold text-foreground">Tu página pública</h2>
          <p className="-mt-2 text-sm text-muted-foreground">
            Así te van a encontrar en miseby.com.
          </p>

          <Field data-invalid={Boolean(errors.username)}>
            <FieldLabel htmlFor="username">Nombre de usuario</FieldLabel>
            <div className="flex items-center gap-0">
              <span className="rounded-l-xl border border-r-0 border-input bg-muted px-3 py-3 text-sm text-muted-foreground">
                miseby.com/
              </span>
              <Input
                id="username"
                className="rounded-l-none px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
                {...register("username", {
                  required: "Requerido",
                  minLength: { value: 3, message: "Mínimo 3 caracteres" },
                  pattern: { value: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, message: "Solo letras, números y guiones" },
                })}
              />
            </div>
            {errors.username && <FieldError errors={[{ message: errors.username.message }]} />}
          </Field>

          <Field>
            <FieldLabel htmlFor="bio">Bio</FieldLabel>
            <Textarea
              id="bio"
              rows={3}
              maxLength={200}
              placeholder="Contá en una línea qué hacés…"
              className={inputCls}
              {...register("bio")}
            />
          </Field>
        </FieldGroup>
      )}

      {(planCode === "mise" || planCode === "mise_restaurant") && (
        <FieldGroup>
          <h2 className="text-base font-semibold text-foreground">
            {planCode === "mise_restaurant" ? "Horarios y contacto" : "Contacto directo"}
          </h2>

          {planCode === "mise_restaurant" && (
            <Field>
              <FieldLabel htmlFor="schedule-btn">Horarios de atención</FieldLabel>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {scheduleSummary(schedule)}
              </p>
              <Button
                id="schedule-btn"
                type="button"
                variant="outline"
                onClick={() => setScheduleOpen(true)}
                className="mt-2 w-full sm:w-auto"
              >
                <Clock className="h-4 w-4" /> Configurar horarios
              </Button>
              <ScheduleDialog
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                value={schedule}
                onSave={setSchedule}
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="whatsapp">WhatsApp para pedidos o consultas</FieldLabel>
            <Input id="whatsapp" placeholder="+57 300 123 4567" className={inputCls} {...register("whatsapp")} />
          </Field>

          {planCode === "mise" && (
            <p className="text-sm text-muted-foreground">
              Después vas a poder cargar tu{" "}
              <Link href="/dashboard/catalogo" className="font-semibold text-[#0E88E2] hover:underline">
                catálogo de productos
              </Link>
              .
            </p>
          )}
        </FieldGroup>
      )}

      {serverError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar y entrar al panel
      </Button>
    </form>
  );
}

export function onboardingTitle(planCode: OnboardingPlanCode) {
  return PLAN_TITLE[planCode] ?? PLAN_TITLE.mise;
}
