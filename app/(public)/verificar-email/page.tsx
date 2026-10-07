import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { confirmEmailVerification } from "@/lib/services/auth";

export const metadata: Metadata = {
  title: "Verificar email | MISE BY",
  description: "Confirmá tu cuenta de MISE BY.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let ok = false;
  let error = "Falta el token de verificación.";
  if (token) {
    try {
      await confirmEmailVerification(token);
      ok = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Token inválido";
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#edf5fb] px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <MiseMark />
        </div>
        {ok ? (
          <section className="space-y-5 border-y border-emerald-200 bg-background px-6 py-8 text-center sm:px-10 sm:py-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Email verificado
            </h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Tu cuenta está activa. Ya podés entrar a tu panel.
            </p>
            <Link
              href="/login"
              className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#075296] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0E88E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075296] focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </Link>
          </section>
        ) : (
          <section className="space-y-5 border-y border-red-200 bg-background px-6 py-8 text-center sm:px-10 sm:py-10">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              No se pudo verificar
            </h1>
            <p role="alert" className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              {error}. Pedí un nuevo enlace intentando iniciar sesión.
            </p>
            <Link
              href="/login"
              className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#075296] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0E88E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#075296] focus-visible:ring-offset-2"
            >
              Ir a iniciar sesión
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
