import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "business_owner" && user.role !== "business_member")) {
    redirect("/login");
  }

  return <>{children}</>;
}
