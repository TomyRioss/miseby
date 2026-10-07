import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "business_owner" && user.role !== "business_member")) {
    redirect("/login");
  }

  // auth() es solo decrypt del JWT (sin DB): la sesión inicial evita
  // que el provider fetchee /api/auth/session en cada mount.
  const session = await auth();

  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
