import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | MISE BY",
  description: "Accedé a tu cuenta MISE BY.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <div className="mise-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex xl:p-16">
        <MiseMark tone="white" />
        <div className="relative z-10">
          <h2 className="font-display max-w-md text-5xl font-semibold leading-[1.04] tracking-tight xl:text-6xl">
            Tu negocio, tu panel, tu digital.
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/85">
            Gestioná tu negocio o el Control Center de la plataforma.
          </p>
        </div>
        <p className="text-xs font-medium tracking-wide text-white/75">miseby.com</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <Link
          href="/"
          className="cursor-pointer mb-10 inline-flex min-h-10 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="lg:hidden">
          <MiseMark tone="brand" />
        </div>

        <h1 className="font-display mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Iniciar sesión</h1>
        <p className="mt-2 text-base text-muted-foreground">Accedé a tu cuenta MISE BY.</p>

        <LoginForm />

        <p className="mt-6 text-sm text-muted-foreground">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="cursor-pointer font-semibold text-[#0E88E2] hover:underline">
            Registrar mi negocio
          </Link>
        </p>
      </div>
    </div>
  );
}
