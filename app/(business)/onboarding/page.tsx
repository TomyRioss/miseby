import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { MiseMark } from "@/components/brand/mise-mark";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { getOnboardingStatus } from "@/lib/services/onboarding";
import { getOrCreateMiseLinkPage } from "@/lib/services/miselink";
import { getRestaurantData } from "@/lib/restaurant-theme";
import {
  OnboardingForm,
  onboardingTitle,
  type OnboardingInitial,
  type OnboardingPlanCode,
} from "@/components/auth/onboarding-form";

export const metadata: Metadata = {
  title: "Configurá tu negocio | MISE BY",
  description: "Completá los datos de tu negocio para empezar.",
};

const KNOWN_PLANS: OnboardingPlanCode[] = ["mise_link", "mise", "mise_restaurant"];

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getOrganizationForMember(user.id).catch(() => null);
  if (!data?.organization) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <MiseMark />
        <p className="mt-4 text-sm text-muted-foreground">
          Todavía no estás asociado a ningún negocio.
        </p>
        <Button asChild>
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    );
  }

  const org = data.organization;
  const planCode: OnboardingPlanCode = KNOWN_PLANS.includes(
    data.membership?.plan.code as OnboardingPlanCode
  )
    ? (data.membership?.plan.code as OnboardingPlanCode)
    : "mise";

  const status = await getOnboardingStatus(user.id).catch(() => null);
  if (status?.completed) redirect("/dashboard");

  let username = "";
  let bio = "";
  let hours = "";
  let whatsapp = "";
  let schedule = null;

  try {
    const page = await getOrCreateMiseLinkPage(user.id);
    username = page.username ?? "";
    bio = page.bio ?? "";
    const rest = getRestaurantData(page.theme);
    hours = rest.hours ?? "";
    whatsapp = rest.whatsapp ?? "";
    schedule = rest.schedule ?? null;
  } catch (e) {
    console.error("[onboarding]", e);
  }

  // Los miembros no administran: van directo al panel.
  if (data.role !== "business_owner") redirect("/dashboard");

  const initial: OnboardingInitial = {
    commercialName: org.commercialName ?? "",
    phone: org.phone ?? "",
    email: org.email ?? "",
    address: org.address ?? "",
    city: org.city ?? "",
    country: org.country ?? "",
    username,
    bio,
    hours,
    whatsapp,
    schedule,
  };

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="mise-gradient relative hidden flex-col justify-between p-12 text-white lg:flex">
        <MiseMark />
        <div>
          <h2 className="font-display max-w-sm text-4xl font-semibold leading-tight">
            Casi listo: contanos de tu negocio.
          </h2>
          <p className="mt-5 max-w-sm text-sm text-white/80">
            Estos datos se muestran en tu página pública y le sirven a tus clientes para
            encontrarte y contactarte.
          </p>
        </div>
        <p className="text-xs text-white/70">miseby.com</p>
      </div>

      <div className="flex flex-col overflow-y-auto bg-background px-6 py-10 sm:px-14">
        <div className="lg:hidden">
          <MiseMark />
        </div>

        <h1 className="font-display mt-6 text-2xl font-semibold text-foreground">
          {onboardingTitle(planCode)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Completá esta info para empezar a vender.
        </p>

        <OnboardingForm planCode={planCode} initial={initial} />

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Completar más tarde <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
