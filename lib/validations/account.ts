import { z } from "zod";

export const updateProfileNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresá tu nombre (mínimo 2 caracteres)")
    .max(80, "Nombre muy largo (máximo 80 caracteres)"),
});
export type UpdateProfileNameInput = z.infer<typeof updateProfileNameSchema>;

export const updateEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email inválido (ej: nombre@mail.com)")
    .max(254, "Email muy largo"),
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
});
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
