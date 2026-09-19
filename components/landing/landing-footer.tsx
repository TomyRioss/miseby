import Link from "next/link";
import { MiseMark } from "@/components/brand/mise-mark";
import { PLANS } from "@/lib/landing/plans";

export function LandingFooter() {
  return (
    <footer className="bg-[#0A2540] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <MiseMark tone="white" />
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Presencia digital para negocios. Elige el plan que mejor se adapte a lo que vendes.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Planes</p>
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
          <p className="text-sm font-semibold">Cuenta</p>
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
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/50 sm:px-6">
          Powered by{" "}
          <a href="https://mardigital.com.co/business" className="cursor-pointer transition-colors hover:text-white/80">
            Mar Digital Business
          </a>
        </p>
      </div>
    </footer>
  );
}
