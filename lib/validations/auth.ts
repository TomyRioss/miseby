import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre (mínimo 2 caracteres)").max(80, "Nombre muy largo"),
  email: z.string().trim().toLowerCase().email("Email inválido (ej: nombre@mail.com)").max(254, "Email muy largo"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres")
    .regex(/[A-Za-z]/, "Incluí al menos una letra")
    .regex(/[0-9]/, "Incluí al menos un número"),
  businessName: z.string().trim().min(2, "Nombre de negocio muy corto").max(100, "Nombre muy largo"),
  country: z.string().min(2, "Elegí tu país"),
  planCode: z.enum(["mise_link", "mise", "mise_restaurant"]).default("mise"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Requerido"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
