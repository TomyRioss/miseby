import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { RegisterForm, RegisterFeatures } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Crear cuenta | MISE BY",
  description: "Registra tu negocio en MISE BY.",
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="mise-gradient relative hidden flex-col justify-between p-12 text-white lg:flex">
        <MiseMark />
        <div>
          <h2 className="font-display max-w-sm text-4xl font-semibold leading-tight">
            Tu negocio digital comienza aquí.
          </h2>
          <RegisterFeatures />
        </div>
        <p className="text-xs text-white/70">miseby.com</p>
      </div>

      <div className="flex flex-col overflow-y-auto bg-background px-6 py-10 sm:px-14">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Iniciar sesión
        </Link>

        <div className="mb-4 lg:hidden">
          <MiseMark />
        </div>

        <h1 className="font-display text-2xl font-semibold text-foreground">Crear cuenta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Registra tu negocio. Gratis para comenzar.</p>

        <RegisterForm />
      </div>
    </div>
  );
}
