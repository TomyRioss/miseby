import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — MISE BY",
  description: "Accede a tu cuenta MISE BY.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="mise-gradient relative hidden flex-col justify-between p-12 text-white lg:flex">
        <MiseMark />
        <div>
          <h2 className="font-display max-w-sm text-4xl font-semibold leading-tight">
            Tu negocio, tu panel, tu digital.
          </h2>
          <p className="mt-5 max-w-sm text-sm text-white/80">
            Gestiona tu negocio o el Control Center de la plataforma.
          </p>
        </div>
        <p className="text-xs text-white/70">miseby.com</p>
      </div>

      <div className="flex flex-col justify-center bg-background px-6 py-14 sm:px-14">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="lg:hidden">
          <MiseMark />
        </div>

        <h1 className="font-display mt-6 text-2xl font-semibold text-foreground">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-muted-foreground">Accede a tu cuenta MISE BY.</p>

        <LoginForm />

        <p className="mt-6 text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-[#0E88E2] hover:underline">
            Registrar mi negocio
          </Link>
        </p>
      </div>
    </div>
  );
}
