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
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#082b4b] px-5 py-12 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <MiseMark tone="white" />
        </div>

        <section className="bg-background p-6 sm:p-9">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Nueva contraseña</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Define una contraseña nueva para tu cuenta.</p>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>

          <Link href="/login" className="cursor-pointer mt-6 flex min-h-10 items-center justify-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Volver a iniciar sesión
          </Link>
        </section>
      </div>
    </main>
  );
}
