"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/google-button";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError("");
    try {
      const result = await loginAction(values.email, values.password);
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        // Dejá el email, limpiá solo la contraseña y devolvé el foco ahí.
        setValue("password", "");
        setFocus("password");
        return;
      }
      toast.success("Sesión iniciada. Te llevamos a tu panel…");
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      console.error("[login]", err);
      const message =
        err instanceof Error && err.message ? err.message : "Ocurrió un error al iniciar sesión. Intentá de nuevo en unos segundos.";
      setServerError(message);
      toast.error(message);
      setValue("password", "");
      setFocus("password");
    }
  };

  return (
    <div className="mt-8 max-w-sm space-y-5">
      <GoogleButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o ingresá con tu email
        <span className="h-px flex-1 bg-border" />
      </div>

    <form onSubmit={handleSubmit(onSubmit)} method="post" noValidate className="space-y-5">
      <FieldGroup>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
            {...register("email")}
          />
          {errors.email && <FieldError errors={[{ message: errors.email.message }]} />}
        </Field>

        <Field data-invalid={Boolean(errors.password)}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Link href="/forgot-password" className="cursor-pointer text-xs text-[#0E88E2] hover:underline">
              ¿Te olvidaste tu contraseña?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className="rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
            {...register("password")}
          />
          {errors.password && <FieldError errors={[{ message: errors.password.message }]} />}
        </Field>
      </FieldGroup>

      {serverError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="font-medium">{serverError}</p>
            <p className="text-xs text-red-600">
              Si no recordás tu contraseña,{" "}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-2 hover:text-red-800">
                recuperala acá
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Ingresar
      </Button>
    </form>
    </div>
  );
}
