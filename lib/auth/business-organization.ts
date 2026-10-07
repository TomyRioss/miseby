import "server-only";
import { requireBusinessUser } from "@/lib/auth/guards";
import { getOrganizationForMember } from "@/lib/services/organizations";

export async function requireActiveBusinessOrganization() {
  const user = await requireBusinessUser();
  const data = await getOrganizationForMember(user.id);
  if (!data?.organization || data.organization.status !== "active") {
    throw new Error("Tu negocio no está activo.");
  }
  return { user, org: data.organization };
}
