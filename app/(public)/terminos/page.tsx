import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos de Servicio | MISE BY",
  description:
    "Términos de Servicio de MISE BY: condiciones de uso de la plataforma de cartas digitales y miselinks.",
};

const sections = [
  {
    title: "1. Objeto del servicio",
    body: "MISE BY es una plataforma de cartas digitales, catálogos y enlaces (miselinks) para negocios. Al crear una cuenta aceptás estos términos y te comprometés a usar la plataforma conforme a la normativa vigente.",
  },
  {
    title: "2. Cuentas",
    body: "Sos responsable de la veracidad de los datos de registro, de mantener la confidencialidad de tus credenciales y de toda actividad realizada con tu cuenta. Debés notificarnos ante cualquier uso no autorizado.",
  },
  {
    title: "3. Planes",
    body: "MISE BY ofrece planes gratuitos y de pago con distintas funcionalidades y límites. Podés cambiar o cancelar tu plan en cualquier momento; los cambios rigen desde el siguiente ciclo de facturación.",
  },
  {
    title: "4. Uso aceptable",
    body: "Queda prohibido publicar contenido ilegal, engañoso, difamatorio o que infrinja derechos de terceros, así como intentar vulnerar la seguridad de la plataforma, enviar spam o usar la plataforma para fines distintos a los previstos.",
  },
  {
    title: "5. Pagos y facturación",
    body: "Los planes de pago se facturan por adelantado según el ciclo contratado. Los precios pueden incluir impuestos aplicables. La falta de pago puede derivar en la suspensión o degradación del servicio.",
  },
  {
    title: "6. Cancelación",
    body: "Podés cancelar tu suscripción cuando quieras desde tu panel. La cancelación no genera reembolsos por períodos ya facturados, salvo lo exigido por la ley aplicable. Conservaremos tus datos según nuestra Política de Privacidad.",
  },
  {
    title: "7. Responsabilidad",
    body: "MISE BY se brinda «tal cual», sin garantías expresas salvo las legalmente exigibles. No respondemos por daños indirectos, lucro cesante ni por el contenido publicado por los usuarios. Nuestra responsabilidad total no excederá lo abonado en los últimos doce meses.",
  },
  {
    title: "8. Contacto",
    body: "Para consultas sobre estos términos escribinos a soporte@miseby.com.",
  },
];

export default function TerminosPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="mt-6 text-3xl font-semibold text-foreground">
        Términos de Servicio
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
