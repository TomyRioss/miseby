import { z } from "zod";

export const passwordSchema = z.string().min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Incluí al menos una letra")
  .regex(/[0-9]/, "Incluí al menos un número")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "La contraseña supera 72 bytes");

export const securityTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, "Token inválido");

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  password: z.string().min(1, "La contraseña es requerida").max(72)
    .refine((value) => new TextEncoder().encode(value).length <= 72, "La contraseña supera 72 bytes"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre (mínimo 2 caracteres)").max(80, "Nombre muy largo"),
  email: z.string().trim().toLowerCase().email("Email inválido (ej: nombre@mail.com)").max(254, "Email muy largo"),
  password: passwordSchema,
  businessName: z.string().trim().min(2, "Nombre de negocio muy corto").max(100, "Nombre muy largo"),
  country: z.string().min(2, "Elegí tu país"),
  planCode: z.enum(["mise_link", "mise", "mise_restaurant"]).default("mise"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: securityTokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Requerido").max(72),
    newPassword: passwordSchema,
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
