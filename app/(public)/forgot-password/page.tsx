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
    <main className="flex min-h-[100dvh] flex-col justify-center bg-[#eff5fa] px-5 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">
          <MiseMark className="text-[#075296]" />
        </div>

        <section className="border-y border-[#bfd2e1] bg-background px-5 py-7 sm:px-8 sm:py-9">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Recuperar contraseña</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Te enviaremos un enlace para definir una nueva contraseña.
          </p>

          <ForgotPasswordForm />

          <Link href="/login" className="cursor-pointer mt-6 flex min-h-10 items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
          </Link>
        </section>
      </div>
    </main>
  );
}
