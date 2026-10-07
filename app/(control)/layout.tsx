import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PlatformShell } from "@/components/control/platform-shell";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export default async function ControlLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "platform_owner") {
    redirect("/login");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  const session = await auth();

  return <AuthSessionProvider session={session}><PlatformShell userName={profile?.name ?? "Cuenta"} userEmail={user.email}>{children}</PlatformShell></AuthSessionProvider>;
}
