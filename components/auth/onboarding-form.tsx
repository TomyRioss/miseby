"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { updateBusinessProfileAction, saveRestaurantHoursAction } from "@/lib/actions/restaurant";
import { updateUsernameAction, updateProfileAction } from "@/lib/actions/miselink";

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
}

interface OnboardingFormProps {
  planCode: OnboardingPlanCode;
  initial: OnboardingInitial;
}

const inputCls =
  "rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40";

export function OnboardingForm({ planCode, initial }: OnboardingFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
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
        const msg = `No se pudo guardar los datos del negocio: ${base.error}`;
        setServerError(msg);
        toast.error(msg);
        return;
      }

      if (planCode === "mise_link") {
        const username = values.username.trim().toLowerCase();
        if (username && username !== initial.username) {
          const r = await updateUsernameAction(username);
          if (!r.ok) {
            const msg = `No se pudo guardar tu nombre de usuario: ${r.error}`;
            setServerError(msg);
            toast.error(msg);
            return;
          }
        }
        const r2 = await updateProfileAction({ bio: values.bio.trim() });
        if (!r2.ok) {
          const msg = `No se pudo guardar tu bio: ${r2.error}`;
          setServerError(msg);
          toast.error(msg);
          return;
        }
      }

      if (planCode === "mise_restaurant" || planCode === "mise") {
        const r3 = await saveRestaurantHoursAction({
          hours: values.hours.trim(),
          whatsapp: values.whatsapp.trim(),
        });
        if (!r3.ok) {
          const msg = `No se pudo guardar el contacto: ${r3.error}`;
          setServerError(msg);
          toast.error(msg);
          return;
        }
      }

      toast.success("¡Listo! Tu negocio está configurado.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[onboarding]", err);
      const detail = err instanceof Error && err.message ? `: ${err.message}` : ".";
      const msg = `Ocurrió un error inesperado al guardar${detail} Revisá tu conexión e intentá de nuevo.`;
      setServerError(msg);
      toast.error(msg);
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
            <FieldLabel htmlFor="phone">
              Teléfono / WhatsApp <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Input id="phone" autoComplete="tel" placeholder="+57 300 123 4567" className={inputCls} {...register("phone")} />
            {errors.phone && <FieldError errors={[{ message: errors.phone.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">
              Email de contacto <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="hola@minegocio.com"
              className={inputCls}
              {...register("email", {
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido (ej: nombre@mail.com)" },
              })}
            />
            {errors.email && <FieldError errors={[{ message: errors.email.message }]} />}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.city)}>
            <FieldLabel htmlFor="city">
              Ciudad <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Input id="city" autoComplete="address-level2" placeholder="Bogotá" className={inputCls} {...register("city")} />
            {errors.city && <FieldError errors={[{ message: errors.city.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.address)}>
            <FieldLabel htmlFor="address">
              Dirección <span className="font-normal text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <Input id="address" autoComplete="street-address" placeholder="Calle 123 #45-67" className={inputCls} {...register("address")} />
            {errors.address && <FieldError errors={[{ message: errors.address.message }]} />}
          </Field>
        </div>

        <Field data-invalid={Boolean(errors.country)}>
          <FieldLabel htmlFor="country">
            País <span className="font-normal text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <Input id="country" autoComplete="country-name" placeholder="Colombia" className={inputCls} {...register("country")} />
          {errors.country && <FieldError errors={[{ message: errors.country.message }]} />}
        </Field>
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
              <FieldLabel htmlFor="hours">Horarios de atención</FieldLabel>
              <Textarea
                id="hours"
                rows={3}
                maxLength={600}
                placeholder="Lun a Vie 12:00–22:00, Sáb y Dom 11:00–23:00"
                className={inputCls}
                {...register("hours")}
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
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? "Guardando…" : "Guardar y entrar al panel"}
      </Button>
    </form>
  );
}

