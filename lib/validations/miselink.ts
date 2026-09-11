import { z } from "zod";
import { RESERVED_USERNAMES } from "@/lib/miselink/reserved-usernames";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Solo letras, números y guiones (sin espacios)")
  .refine((v) => !RESERVED_USERNAMES.has(v), "Ese nombre no está disponible");

export const profileSchema = z.object({
  displayName: z.string().trim().max(60, "Máximo 60 caracteres").optional(),
  bio: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  avatarUrl: z.string().trim().url("URL inválida").max(2000).optional().or(z.literal("")),
  showFollowers: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const SOCIAL_NETWORKS = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "linkedin",
  "facebook",
  "spotify",
  "website",
  "maps",
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const MISELINK_ITEM_TYPES = ["link", "collection"] as const;
export type MiseLinkItemKind = (typeof MISELINK_ITEM_TYPES)[number];

export const linkDataSchema = z
  .object({
    thumbnail: z.string().trim().url("URL inválida").max(2000).optional().or(z.literal("")),
    highlight: z.boolean().optional(),
    locked: z.boolean().optional(),
  })
  .optional();
export type LinkData = z.infer<typeof linkDataSchema>;

export const linkItemSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(100, "Máximo 100 caracteres"),
  url: z
    .string()
    .trim()
    .url("URL inválida")
    .max(2000)
    .optional()
    .or(z.literal("")),
  active: z.boolean().optional(),
  type: z.enum(MISELINK_ITEM_TYPES).optional(),
  parentId: z.string().uuid().nullable().optional(),
  data: linkDataSchema,
  scheduledStart: z.coerce.date().nullable().optional(),
  scheduledEnd: z.coerce.date().nullable().optional(),
});
export type LinkItemInput = z.infer<typeof linkItemSchema>;

export const socialSchema = z.object({
  network: z.enum(SOCIAL_NETWORKS),
  url: z.string().trim().url("URL inválida").max(2000),
});
export type SocialInput = z.infer<typeof socialSchema>;

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Lista vacía"),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido");

export const themeSchema = z.object({
  preset: z.string().trim().max(40).optional(),
  header: z.enum(["classic", "hero", "banner", "cutout", "shape", "compact"]).optional(),
  wallpaper: z.enum(["fill", "gradient", "soft"]).optional(),
  buttonStyle: z.enum(["fill", "outline", "soft", "round"]).optional(),
  font: z.enum(["sans", "serif", "mono", "round"]).optional(),
  colors: z
    .object({
      background: hexColor.optional(),
      text: hexColor.optional(),
      button: hexColor.optional(),
      buttonText: hexColor.optional(),
    })
    .optional(),
  wallpaperGradient: z.object({ from: hexColor, to: hexColor }).optional(),
  footerVisible: z.boolean().optional(),
  footerText: z.string().trim().max(120).optional(),
});
export type ThemeInput = z.infer<typeof themeSchema>;
