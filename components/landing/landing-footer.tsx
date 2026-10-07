import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";
import { PLANS } from "@/lib/landing/plans";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0A2540] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <MiseMark tone="white" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/75">
            Presencia digital para negocios. Elige el plan que mejor se adapte a lo que vendes.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Planes</p>
          <ul className="mt-4 space-y-2.5">
            {PLANS.map((plan) => (
              <li key={plan.slug}>
                <Link
                  href={plan.href}
                  className="cursor-pointer text-sm text-white/70 transition-colors hover:text-white"
                >
                  {plan.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Cuenta</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/login" className="cursor-pointer text-sm text-white/70 transition-colors hover:text-white">
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="cursor-pointer text-sm text-white/70 transition-colors hover:text-white"
              >
                Registrar mi negocio
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Powered by{" "}
            <a href="https://mardigital.com.co/business" className="cursor-pointer transition-colors hover:text-white/80">
              Mar Digital Business
            </a>
          </p>
          <nav aria-label="Enlaces legales">
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              <li>
                <Link
                  href="/terminos"
                  className="cursor-pointer text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Términos y condiciones
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="cursor-pointer text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
