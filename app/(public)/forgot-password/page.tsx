import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | MISE BY",
  description: "Solicita un enlace para restablecer tu contraseña de MISE BY.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mise-grid-bg relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#1FD0FF]/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <MiseMark className="text-[#075296]" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold text-foreground">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviaremos un enlace para definir una nueva contraseña.
          </p>

          <ForgotPasswordForm />

          <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
