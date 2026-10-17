import { redirect } from "next/navigation";
import { getAuthSession, getCurrentUser } from "@/lib/auth/session";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "business_owner" && user.role !== "business_admin" && user.role !== "business_member")) {
    redirect("/login");
  }

  // Reutiliza la sesión ya leída y validada por getCurrentUser().
  const session = await getAuthSession();

  return <AuthSessionProvider session={session}>{children}</AuthSessionProvider>;
}
