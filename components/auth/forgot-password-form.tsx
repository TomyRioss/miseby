"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const result = await forgotPasswordAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("No fue posible enviar el correo. Intenta de nuevo.");
    }
  };

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#BEE2FB] bg-[#E8F4FE] px-4 py-4 text-sm text-[#075296]">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.8} />
        <div>
          <p className="font-semibold">Revisa tu correo</p>
          <p className="mt-0.5">Si la cuenta existe, llegará un enlace de restablecimiento válido por 60 minutos.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="email">Correo</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border-input bg-card px-4 py-3 focus-visible:border-[#0E88E2] focus-visible:ring-[#1FD0FF]/40"
          {...register("email")}
        />
        {errors.email && <FieldError errors={[{ message: errors.email.message }]} />}
      </Field>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#075296] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0E88E2]"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enviar enlace
      </Button>
    </form>
  );
}
