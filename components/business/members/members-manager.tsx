"use client";

import { InviteForm } from "./invite-form";
import { MembersList } from "./members-list";
import type { ActorRole, OrgInvitationItem, OrgMemberItem } from "./types";
import {
  cancelOrgInvitation,
  changeOrgMemberRole,
  inviteOrgMember,
  removeOrgMember,
} from "@/lib/actions/members";

export function MembersManager({
  actorRole,
  orgId,
  initialMembers,
  initialInvitations,
}: {
  actorRole: ActorRole;
  orgId: string;
  initialMembers: OrgMemberItem[];
  initialInvitations: OrgInvitationItem[];
}) {
  return (
    <div className="space-y-6">
      <InviteForm actorRole={actorRole} orgId={orgId} onInvite={(input) => inviteOrgMember(input)} />
      <MembersList
        actorRole={actorRole}
        orgId={orgId}
        initialMembers={initialMembers}
        initialInvitations={initialInvitations}
        onChangeRole={(oId, userId, role) => changeOrgMemberRole(oId, userId, role)}
        onRemove={(oId, userId) => removeOrgMember(oId, userId)}
        onCancelInvitation={(oId, invitationId) => cancelOrgInvitation(oId, invitationId)}
      />
    </div>
  );
}
