import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido");

export const businessProfileSchema = z.object({
  commercialName: z.string().trim().min(2, "Mínimo 2 caracteres").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(160).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
});
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

export const restaurantAppearanceSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  background: hexColor,
  text: hexColor,
  titleFont: z.enum(["sans", "serif", "mono", "round"]),
  bodyFont: z.enum(["sans", "serif", "mono", "round"]),
  showPrices: z.boolean(),
  showImages: z.boolean(),
  showDescriptions: z.boolean(),
});
export type RestaurantAppearanceInput = z.infer<typeof restaurantAppearanceSchema>;

export const restaurantCategorySchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Nombre requerido").max(60),
  order: z.number().int().min(0).max(10000),
});
export type RestaurantCategoryInput = z.infer<typeof restaurantCategorySchema>;

const restaurantVariantSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Nombre requerido").max(60),
  price: z.number().min(0).max(100000000),
  costPrice: z.number().min(0).max(100000000).nullable().optional(),
  packagingPrice: z.number().min(0).max(100000000).nullable().optional(),
  sku: z.string().trim().max(64).nullable().optional().or(z.literal("")),
  isDefault: z.boolean(),
});

const restaurantModifierSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Nombre requerido").max(60),
  price: z.number().min(0).max(100000000),
});

const restaurantModifierGroupSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1, "Nombre requerido").max(60),
  required: z.boolean(),
  multiple: z.boolean(),
  modifiers: restaurantModifierSchema.array().max(50),
});

export const restaurantProductSchema = z.object({
  id: z.string().min(1).max(64),
  categoryId: z.string().min(1, "Elegí una categoría"),
  name: z.string().trim().min(1, "Nombre requerido").max(80),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  price: z.number().min(0).max(100000000),
  available: z.boolean(),
  imageUrl: z.string().trim().url("URL inválida").max(2000).nullable().optional().or(z.literal("")),
  takeAway: z.boolean().optional(),
  variants: restaurantVariantSchema.array().max(20).optional(),
  modifierGroups: restaurantModifierGroupSchema.array().max(20).optional(),
});
export type RestaurantProductInput = z.infer<typeof restaurantProductSchema>;

export const saveMenuSchema = z.object({
  categories: restaurantCategorySchema.array().max(100),
  products: restaurantProductSchema.array().max(500),
});
export type SaveMenuInput = z.infer<typeof saveMenuSchema>;

export const restaurantIaSchema = z.object({
  isActive: z.boolean(),
  whatToRecommend: z.string().trim().max(600).optional().or(z.literal("")),
  customInstructions: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type RestaurantIaInput = z.infer<typeof restaurantIaSchema>;

const timeSlotSchema = z.object({
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
});
const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  slots: timeSlotSchema.array().min(1).max(3),
});

export const restaurantHoursSchema = z.object({
  hours: z.string().trim().max(600).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(40).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  facebook: z.string().trim().max(200).optional().or(z.literal("")),
  tiktok: z.string().trim().max(200).optional().or(z.literal("")),
  x: z.string().trim().max(200).optional().or(z.literal("")),
  schedule: z
    .object({
      timezone: z.string().trim().min(1).max(64),
      days: z.object({
        mon: dayScheduleSchema,
        tue: dayScheduleSchema,
        wed: dayScheduleSchema,
        thu: dayScheduleSchema,
        fri: dayScheduleSchema,
        sat: dayScheduleSchema,
        sun: dayScheduleSchema,
      }),
    })
    .optional(),
});
export type RestaurantHoursInput = z.infer<typeof restaurantHoursSchema>;
