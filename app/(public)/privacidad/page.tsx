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
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href="/register"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-foreground">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última actualización: septiembre 2026.
      </p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
