// Formas compatibles con lo que devuelve @/lib/actions/members (listOrgMembers).
// El backend incluye más campos (ids, timestamps); acá solo se tipa lo que usa la UI.

export type ActorRole = "business_owner" | "business_admin";

export type OrgMemberItem = {
  id: string;
  userId: string;
  role: string;
  status: string;
  user: { id: string; name: string | null; email: string };
  isSelf?: boolean;
};

export type OrgInvitationItem = {
  id: string;
  email: string;
  role: string;
  expiresAt?: string | Date | null;
};

export type MembersActionResult = { ok: true } | { ok: false; error: string };
