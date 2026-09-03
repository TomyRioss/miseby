import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PlatformShell } from "@/components/control/platform-shell";

export default async function ControlLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || user.role !== "platform_owner") {
    redirect("/login");
  }

  return <PlatformShell userLabel={user.email}>{children}</PlatformShell>;
}
