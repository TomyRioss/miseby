"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    setServerError("");
    if (!token) {
      setServerError("El enlace no es válido o ha expirado.");
      return;
    }
    try {
      const result = await resetPasswordAction({ ...values, token });
      if (!result.ok) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err) {
      console.error(err);
      setServerError("No fue posible restablecer la contraseña. El enlace puede haber expirado.");
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={1.8} />
        <div>
          <p className="font-semibold">Contraseña actualizada</p>
          <p className="mt-0.5">Te redirigimos al inicio de sesión…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <Field data-invalid={Boolean(errors.password)}>
        <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            className="w-full rounded-xl border-input bg-card px-4 py-3 pr-11 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
            {...register("password")}
          />
          <button
            type="button"
            aria-label="Mostrar"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <FieldError errors={[{ message: errors.password.message }]} />}
      </Field>

      <Field data-invalid={Boolean(errors.confirmPassword)}>
        <FieldLabel htmlFor="confirmPassword">Confirmar</FieldLabel>
        <Input
          id="confirmPassword"
          type={show ? "text" : "password"}
          className="w-full rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && <FieldError errors={[{ message: errors.confirmPassword.message }]} />}
      </Field>

      <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>

      {serverError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Guardar contraseña
      </Button>
    </form>
  );
}
