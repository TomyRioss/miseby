import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrganizationForMember } from "@/lib/services/organizations";
import { BusinessHeader, BusinessSidebar } from "@/components/business/business-header";
import { SidebarAccount } from "@/components/business/sidebar-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/landing/plans";
import { PLAN_LABELS } from "@/lib/mise-labels";

export const metadata: Metadata = { title: "Billing y planes | MISE BY" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let data: Awaited<ReturnType<typeof getOrganizationForMember>> = null;
  try {
    data = await getOrganizationForMember(user.id);
  } catch (e) {
    console.error("[billing page]", e);
  }
  if (!data?.organization) {
    return <div className="p-10 text-sm text-muted-foreground">No pudimos cargar tu facturación.</div>;
  }

  const planCode = data.membership?.plan.code;
  const current = PLANS.find((p) => p.code === planCode);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <BusinessHeader planCode={planCode} />
      <div className="flex min-h-0 flex-1">
        <BusinessSidebar account={<SidebarAccount />} hasMiseLink={false} planCode={planCode} orgRole={data.role} />
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mx-auto w-full max-w-5xl">
            <h1 className="font-display text-2xl font-semibold">Billing y planes</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Tu plan actual y las opciones disponibles.
            </p>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  Plan actual
                  <Badge>Plan actual</Badge>
                </CardTitle>
                <CardDescription>
                  {current
                    ? `${current.name} — ${current.tagline}`
                    : (PLAN_LABELS[planCode ?? ""] ?? "Sin plan activo")}
                </CardDescription>
              </CardHeader>
              {current ? (
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{current.priceLabel}</span>{" "}
                    · {current.priceNote}
                  </p>
                  <Button asChild variant="outline" className="cursor-pointer">
                    <Link href={current.href}>Ver mi plan</Link>
                  </Button>
                </CardContent>
              ) : null}
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = plan.code === planCode;
                return (
                  <Card
                    key={plan.code}
                    className={isCurrent ? "border-primary" : undefined}
                  >
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        <span
                          aria-hidden
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: plan.accent }}
                        />
                        {plan.name}
                        {isCurrent ? <Badge>Plan actual</Badge> : null}
                      </CardTitle>
                      <CardDescription>{plan.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        <span className="font-semibold">{plan.priceLabel}</span>{" "}
                        <span className="text-muted-foreground">· {plan.priceNote}</span>
                      </p>
                      <ul className="mt-4 space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f.title} className="flex gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>
                              <span className="font-medium">{f.title}</span>
                              <span className="block text-xs text-muted-foreground">{f.detail}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        variant={isCurrent ? "outline" : "default"}
                        className="mt-6 w-full cursor-pointer"
                      >
                        <Link href={plan.href}>
                          {isCurrent ? "Ver plan" : `Elegir ${plan.shortName}`}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
