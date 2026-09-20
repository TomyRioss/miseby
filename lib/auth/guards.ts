import "server-only";
import { getCurrentUser } from "@/lib/auth/session";

export async function requirePlatformOwner() {
  const user = await getCurrentUser();
  if (!user || user.role !== "platform_owner") {
    throw new Error("No autorizado");
  }
  return user;
}

export async function requireBusinessUser() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "business_owner" && user.role !== "business_admin" && user.role !== "business_member")) {
    throw new Error("No autorizado");
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("No autorizado");
  return user;
}
