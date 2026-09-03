import { z } from "zod";

export const businessTypeEnum = z.enum(["restaurant", "commerce", "services", "other"]);
export const organizationStatusEnum = z.enum(["pending", "active", "suspended", "cancelled"]);
export const membershipStatusEnum = z.enum([
  "pending",
  "trial",
  "active",
  "suspended",
  "expired",
  "cancelled",
]);
export const membershipSourceEnum = z.enum(["manual", "trial", "founder", "internal", "stripe"]);
export const invitationRoleEnum = z.enum(["business_owner", "business_member"]);

export const organizationSchema = z.object({
  commercialName: z.string().min(2, "Mínimo 2 caracteres"),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  businessType: businessTypeEnum,
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  internalNotes: z.string().optional(),
});
export type OrganizationInput = z.infer<typeof organizationSchema>;

export const organizationStatusSchema = z.object({
  status: organizationStatusEnum,
});

export const membershipSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
  status: membershipStatusEnum.optional(),
  source: membershipSourceEnum.optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  trialEndsAt: z.string().optional(),
  internalNotes: z.string().optional(),
});
export type MembershipInput = z.infer<typeof membershipSchema>;

export const membershipUpdateSchema = membershipSchema.partial().omit({ organizationId: true });

export const invitationSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: invitationRoleEnum,
});
export type InvitationInput = z.infer<typeof invitationSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});
