ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'business_admin';
ALTER TYPE "OrganizationMemberRole" ADD VALUE IF NOT EXISTS 'business_admin';
ALTER TYPE "InvitationRole" ADD VALUE IF NOT EXISTS 'business_admin';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'member_invited';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'member_removed';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'member_role_changed';
