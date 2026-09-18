"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { registerSchema } from "@/lib/validations/auth";
import { registerAction, loginAction } from "@/lib/actions/auth";

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
    confirmPassword: z.string(),
    terms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.terms, { message: "Debes aceptar los términos", path: ["terms"] });

type FormValues = z.infer<typeof formSchema>;

const inputCls = "rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { country: "CO", terms: false },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    try {
      const result = await registerAction({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        businessName: values.businessName.trim(),
        country: values.country,
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
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setServerError("No fue posible completar el registro.");
      toast.error("No fue posible completar el registro.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-sm space-y-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
          <Input id="name" autoComplete="name" className={inputCls} {...register("name")} />
          {errors.name && <FieldError errors={[{ message: errors.name.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input id="email" type="email" autoComplete="email" className={inputCls} {...register("email")} />
          {errors.email && <FieldError errors={[{ message: errors.email.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <PasswordInput id="password" autoComplete="new-password" className={inputCls} {...register("password")} />
          {errors.password && <FieldError errors={[{ message: errors.password.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
          <PasswordInput id="confirmPassword" autoComplete="new-password" className={inputCls} {...register("confirmPassword")} />
          {errors.confirmPassword && <FieldError errors={[{ message: errors.confirmPassword.message }]} />}
        </Field>

        <hr className="border-border" />

        <Field data-invalid={Boolean(errors.businessName)}>
          <FieldLabel htmlFor="businessName">Nombre del negocio</FieldLabel>
          <Input id="businessName" className={inputCls} {...register("businessName")} />
          {errors.businessName && <FieldError errors={[{ message: errors.businessName.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.country)}>
          <FieldLabel htmlFor="country">País</FieldLabel>
          <select id="country" className={`${inputCls} bg-card`} {...register("country")}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.country && <FieldError errors={[{ message: errors.country.message }]} />}
        </Field>
      </FieldGroup>

      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-input accent-[#075296]"
          {...register("terms")}
        />
        <label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
          Acepto los{" "}
          <a href="#" className="cursor-pointer text-[#0E88E2] hover:underline">
            términos de servicio
          </a>{" "}
          y la{" "}
          <a href="#" className="cursor-pointer text-[#0E88E2] hover:underline">
            política de privacidad
          </a>
        </label>
      </div>
      {errors.terms && <p className="text-xs text-red-600">{errors.terms.message}</p>}

      {serverError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Crear cuenta
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <a href="/login" className="cursor-pointer font-semibold text-[#0E88E2] hover:underline">
          Iniciar sesión
        </a>
      </p>
    </form>
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
