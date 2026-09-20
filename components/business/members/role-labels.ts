export const ORG_ROLE_LABELS: Record<string, string> = {
  business_owner: "Administrador",
  business_admin: "Admin",
  business_member: "Miembro",
};

export function orgRoleLabel(role: string | null | undefined): string {
  if (!role) return "Miembro";
  return ORG_ROLE_LABELS[role] ?? role;
}
