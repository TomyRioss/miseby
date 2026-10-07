import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | MISE BY",
  description:
    "Política de Privacidad de MISE BY: qué datos recolectamos, con qué finalidad, cookies y tus derechos.",
};

const sections = [
  {
    title: "1. Datos que recolectamos",
    body: "Recolectamos los datos que nos brindás al registrarte y usar la plataforma (nombre, email, datos del negocio, país, contenido de tu carta digital y miselinks), además de datos técnicos de uso (dispositivo, navegador, páginas visitadas).",
  },
  {
    title: "2. Finalidad",
    body: "Usamos tus datos para prestar el servicio, gestionar tu cuenta y planes, procesar pagos, brindarte soporte, mejorar la plataforma y enviarte comunicaciones relacionadas con el servicio.",
  },
  {
    title: "3. Cookies",
    body: "Utilizamos cookies propias y de terceros para mantener tu sesión, recordar preferencias y medir el uso de la plataforma. Podés configurarlas desde tu navegador; desactivarlas puede limitar algunas funciones.",
  },
  {
    title: "4. Tus derechos y eliminación",
    body: "Podés ejercer tus derechos de acceso, rectificación, actualización y supresión (derechos ARCO) escribiendo a privacidad@miseby.com. Podés solicitar la eliminación de tu cuenta y tus datos personales en cualquier momento; conservaremos solo lo exigido por obligaciones legales.",
  },
  {
    title: "5. Contacto",
    body: "Responsable: MISE BY. Contacto de privacidad: privacidad@miseby.com.",
  },
];

export default function PrivacidadPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <Link
        href="/register"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <div className="mt-10 grid gap-8 border-b border-border pb-9 sm:mt-14 sm:grid-cols-[1fr_0.55fr] sm:items-end sm:pb-12">
        <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Política de Privacidad
        </h1>
        <p className="text-sm text-muted-foreground sm:justify-self-end">
          Última actualización: septiembre 2026.
        </p>
      </div>
      <div className="mt-4 divide-y divide-border">
        {sections.map((s) => (
          <section key={s.title} className="grid gap-2 py-6 sm:grid-cols-[0.5fr_1.5fr] sm:gap-10 sm:py-8">
            <h2 className="font-display text-lg font-semibold text-foreground">{s.title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
