import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña | MISE BY",
  description: "Define una nueva contraseña para tu cuenta MISE BY.",
};

export default function ResetPasswordPage() {
  return (
    <div className="mise-grid-bg relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#0E88E2]/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <MiseMark className="text-[#075296]" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold text-foreground">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">Define una contraseña nueva para tu cuenta.</p>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>

          <Link href="/login" className="cursor-pointer mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
