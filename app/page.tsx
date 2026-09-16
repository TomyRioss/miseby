import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MiseMark } from "@/components/brand/mise-mark";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "MISE BY | Presencia digital para negocios",
  description:
    "MISE BY es una plataforma SaaS de presencia digital para negocios. Powered by Mar Digital Business.",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "platform_owner" ? "/control" : "/dashboard");
  }

  return (
    <div className="mise-gradient flex h-full flex-col items-center justify-center overflow-hidden px-6 text-white">
      <Reveal className="max-w-lg text-center">
        <MiseMark className="text-3xl text-white" />
        <p className="mt-4 text-sm font-medium tracking-wide text-white/80">
          Presencia digital para negocios
        </p>

        <div className="mt-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            Iniciar sesión
          </Link>
        </div>
      </Reveal>

      <p className="absolute bottom-8 text-xs text-white/50">
        Powered by{" "}
        <a href="https://mardigital.com.co/business" className="transition-colors hover:text-white/80">
          Mar Digital Business
        </a>
      </p>
    </div>
  );
}
