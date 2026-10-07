import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { RegisterForm, RegisterFeatures } from "@/components/auth/register-form";
import { isPlanSlug } from "@/lib/landing/plans";

export const metadata: Metadata = {
  title: "Crear cuenta | MISE BY",
  description: "Registra tu negocio en MISE BY.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan = isPlanSlug(plan) ? plan : "mise";

  return (
    <div className="grid min-h-[100dvh] bg-[#f3f7fa] lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#082b4b] p-12 text-white lg:flex xl:p-16">
        <MiseMark tone="white" />
        <div className="relative z-10">
          <h2 className="font-display max-w-sm text-5xl font-semibold leading-[1.04] tracking-tight xl:text-6xl">
            Tu negocio digital comienza aquí.
          </h2>
          <div className="mt-8 max-w-md">
            <RegisterFeatures />
          </div>
        </div>
        <p className="text-xs font-medium tracking-wide text-white/70">miseby.com</p>
      </div>

      <div className="flex flex-col overflow-y-auto bg-background px-6 py-10 sm:px-14 xl:px-20">
        <Link href="/login" className="cursor-pointer mb-8 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" /> Iniciar sesión
        </Link>

        <div className="mb-4 lg:hidden">
          <MiseMark tone="brand" />
        </div>

        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Crear cuenta</h1>
        <p className="mt-2 text-base text-muted-foreground">Registra tu negocio. Gratis para comenzar.</p>

        <RegisterForm initialPlan={initialPlan} />
      </div>
    </div>
  );
}
