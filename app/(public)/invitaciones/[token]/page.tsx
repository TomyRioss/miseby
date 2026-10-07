import type { Metadata } from "next";
import { MiseMark } from "@/components/brand/mise-mark";
import { AcceptInvitationForm } from "@/components/invitations/accept-invitation-form";
import { getInvitationByToken } from "@/lib/services/invitations";

export const metadata: Metadata = {
  title: "Aceptar invitación | MISE BY",
  description: "Acepta tu invitación a MISE BY.",
};

export default async function InvitationPage({ params }: PageProps<"/invitaciones/[token]">) {
  const { token } = await params;
  const result = await getInvitationByToken(token);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#eff5fa] px-5 py-12 sm:px-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <MiseMark className="text-2xl text-[#075296]" />
        </div>

        {!result ? (
          <section className="border-y border-red-200 bg-background px-6 py-8 text-center sm:px-10">
            <h1 className="font-display mb-3 text-3xl font-semibold tracking-tight text-foreground">Invitación no válida</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">No encontramos esta invitación.</p>
          </section>
        ) : result.invitation.status !== "pending" ? (
          <section className="border-y border-red-200 bg-background px-6 py-8 text-center sm:px-10">
            <h1 className="font-display mb-3 text-3xl font-semibold tracking-tight text-foreground">Invitación no válida</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.invitation.status === "accepted"
                ? "Esta invitación ya fue aceptada."
                : result.invitation.status === "expired"
                  ? "Esta invitación ha expirado."
                  : "Esta invitación fue cancelada."}
            </p>
          </section>
        ) : (
          <AcceptInvitationForm
            token={token}
            userExists={result.userExists}
            organizationName={result.invitation.organization.commercialName}
            role={result.invitation.role}
          />
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Powered by{" "}
        <a href="https://mardigital.com.co/business" className="cursor-pointer hover:underline">
          Mar Digital Business
        </a>
      </p>
    </main>
  );
}
