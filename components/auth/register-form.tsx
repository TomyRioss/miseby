"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { registerSchema } from "@/lib/validations/auth";
import { registerAction, loginAction } from "@/lib/actions/auth";
import { PlanSelector, planSlugToCode } from "@/components/auth/plan-selector";
import type { PlanSlug } from "@/lib/landing/plans";
import { GoogleButton } from "@/components/auth/google-button";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "CO", label: "Colombia" },
  { code: "MX", label: "México" },
  { code: "AR", label: "Argentina" },
  { code: "CL", label: "Chile" },
  { code: "PE", label: "Perú" },
  { code: "EC", label: "Ecuador" },
  { code: "VE", label: "Venezuela" },
  { code: "BO", label: "Bolivia" },
  { code: "UY", label: "Uruguay" },
  { code: "PY", label: "Paraguay" },
  { code: "US", label: "Estados Unidos" },
  { code: "ES", label: "España" },
  { code: "PA", label: "Panamá" },
  { code: "CR", label: "Costa Rica" },
  { code: "GT", label: "Guatemala" },
  { code: "HN", label: "Honduras" },
  { code: "SV", label: "El Salvador" },
  { code: "NI", label: "Nicaragua" },
  { code: "DO", label: "República Dominicana" },
  { code: "PR", label: "Puerto Rico" },
];

const formSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
    terms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.terms, { message: "Debes aceptar los términos para crear tu cuenta", path: ["terms"] });

type FormValues = z.input<typeof formSchema>;

const inputCls = "rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40";
const inputErrorCls = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

/** Asterisco rojo de campo obligatorio (a11y: anuncia "obligatorio"). */
const RequiredMark = () => (
  <span aria-hidden="true" className="ml-1 font-bold text-red-600">
    *
  </span>
);

function passwordScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) s += 1;
  if (pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)) s += 1;
  return s;
}

export function RegisterForm({ initialPlan = "mise" }: { initialPlan?: PlanSlug }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [plan, setPlan] = useState<PlanSlug>(initialPlan);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { country: "CO", terms: false },
  });

  const passwordValue = watch("password") ?? "";
  const score = passwordScore(passwordValue);
  const scoreLabel = ["", "Débil", "Aceptable", "Fuerte"][score];
  const scoreColor = ["bg-muted", "bg-red-500", "bg-amber-500", "bg-emerald-500"][score];

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      const result = await registerAction({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        businessName: values.businessName.trim(),
        country: values.country,
        planCode: planSlugToCode(plan),
      });
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }

      const loginResult = await loginAction(values.email.trim().toLowerCase(), values.password);
      if (!loginResult.ok) {
        toast.success("Cuenta creada. Iniciá sesión.");
        router.push("/login");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("No fue posible completar el registro.");
      toast.error("No fue posible completar el registro.");
    }
  };

  return (
    <div className="mt-8 max-w-sm space-y-5">
      <GoogleButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o registrate con tu email
        <span className="h-px flex-1 bg-border" />
      </div>

      <p className="text-xs text-muted-foreground">
        Los campos marcados con <span className="font-bold text-red-600">*</span> son obligatorios.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="name">
              Nombre completo
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <Input
              id="name"
              autoComplete="name"
              autoFocus
              placeholder="Ej: María González"
              required
              aria-invalid={Boolean(errors.name)}
              className={cn(inputCls, errors.name && inputErrorCls)}
              {...register("name")}
            />
            {errors.name && <FieldError errors={[{ message: errors.name.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="email">
              Correo electrónico
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nombre@mail.com"
              required
              aria-invalid={Boolean(errors.email)}
              className={cn(inputCls, errors.email && inputErrorCls)}
              {...register("email")}
            />
            {errors.email && <FieldError errors={[{ message: errors.email.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor="password">
              Contraseña
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres, letra + número"
              required
              aria-invalid={Boolean(errors.password)}
              aria-describedby="password-hint"
              className={cn(inputCls, errors.password && inputErrorCls)}
              {...register("password")}
            />
            {passwordValue.length > 0 && (
              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex h-1.5 flex-1 gap-1 overflow-hidden rounded-full">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={cn("h-full flex-1 rounded-full", i < score ? scoreColor : "bg-muted")} />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{scoreLabel}</span>
              </div>
            )}
            <p id="password-hint" className="mt-1 text-xs text-muted-foreground">
              Mínimo 8 caracteres, con al menos una letra y un número.
            </p>
            {errors.password && <FieldError errors={[{ message: errors.password.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirmPassword">
              Confirmar contraseña
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Repetí tu contraseña"
              required
              aria-invalid={Boolean(errors.confirmPassword)}
              className={cn(inputCls, errors.confirmPassword && inputErrorCls)}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <FieldError errors={[{ message: errors.confirmPassword.message }]} />}
          </Field>

          <hr className="border-border" />

          <Field data-invalid={Boolean(errors.businessName)}>
            <FieldLabel htmlFor="businessName">
              Nombre del negocio
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <Input
              id="businessName"
              autoComplete="organization"
              placeholder="Ej: Café Central"
              required
              aria-invalid={Boolean(errors.businessName)}
              className={cn(inputCls, errors.businessName && inputErrorCls)}
              {...register("businessName")}
            />
            {errors.businessName && <FieldError errors={[{ message: errors.businessName.message }]} />}
          </Field>

          <Field data-invalid={Boolean(errors.country)}>
            <FieldLabel htmlFor="country">
              País
              <RequiredMark />
              <span className="sr-only">(obligatorio)</span>
            </FieldLabel>
            <select
              id="country"
              autoComplete="country-name"
              required
              aria-invalid={Boolean(errors.country)}
              className={cn(inputCls, "bg-card w-full", errors.country && inputErrorCls)}
              {...register("country")}
            >
              <option value="" disabled>
                Seleccioná tu país
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.country && <FieldError errors={[{ message: errors.country.message }]} />}
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Elegí tu plan
              <RequiredMark />
            </p>
            <PlanSelector value={plan} onChange={setPlan} />
          </div>
        </FieldGroup>

        <div className={cn("rounded-xl p-1", errors.terms && "ring-1 ring-red-500/60")}>
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-1 h-4 w-4 rounded border-input accent-[#075296]"
              {...register("terms")}
            />
            <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
              Acepto los{" "}
              <Link href="/terminos" target="_blank" className="cursor-pointer text-[#0E88E2] hover:underline">
                términos de servicio
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className="cursor-pointer text-[#0E88E2] hover:underline">
                política de privacidad
              </Link>
              <RequiredMark />
            </label>
          </div>
        </div>
        {errors.terms && (
          <p id="terms-error" role="alert" className="text-xs font-medium text-red-600">
            {errors.terms.message}
          </p>
        )}

        {serverError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Creando tu cuenta…" : "Crear cuenta"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="cursor-pointer font-semibold text-[#0E88E2] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </div>
  );
}

export const RegisterFeatures = () => (
  <ul className="mt-8 space-y-4">
    {["Perfil digital de tu negocio", "Catálogo y carta digital", "Presencia en MISE BY"].map((f) => (
      <li key={f} className="flex items-center gap-3 text-sm text-white/90">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <Check className="h-3.5 w-3.5" />
        </span>
        {f}
      </li>
    ))}
  </ul>
);
