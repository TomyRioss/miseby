import "server-only";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/auth/session";

export const SUSPENDED_MESSAGE = "Tu cuenta fue suspendida. Contactá a soporte.";

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
  if (!user) {
    // Sesión vigente pero perfil suspendido/eliminado → mensaje claro.
    const session = await auth().catch(() => null);
    if (session?.user) throw new Error(SUSPENDED_MESSAGE);
    throw new Error("No autorizado");
  }
  return user;
}
