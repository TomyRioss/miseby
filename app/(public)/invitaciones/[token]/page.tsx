import type { Metadata } from "next";
import { MiseMark } from "@/components/brand/mise-mark";
import { AcceptInvitationForm } from "@/components/invitations/accept-invitation-form";
import { getInvitationByToken } from "@/lib/services/invitations";

export const metadata: Metadata = {
  title: "Aceptar invitación — MISE BY",
  description: "Acepta tu invitación a MISE BY.",
};

export default async function InvitationPage({ params }: PageProps<"/invitaciones/[token]">) {
  const { token } = await params;
  const result = await getInvitationByToken(token);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <MiseMark className="text-2xl text-[#075296]" />
        </div>

        {!result ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="font-display mb-2 text-xl font-semibold text-red-700">Invitación no válida</h1>
            <p className="text-sm text-red-600">No encontramos esta invitación.</p>
          </div>
        ) : result.invitation.status !== "pending" ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h1 className="font-display mb-2 text-xl font-semibold text-red-700">Invitación no válida</h1>
            <p className="text-sm text-red-600">
              {result.invitation.status === "accepted"
                ? "Esta invitación ya fue aceptada."
                : result.invitation.status === "expired"
                  ? "Esta invitación ha expirado."
                  : "Esta invitación fue cancelada."}
            </p>
          </div>
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
        <a href="https://mardigital.com.co/business" className="hover:underline">
          Mar Digital Business
        </a>
      </p>
    </div>
  );
}
