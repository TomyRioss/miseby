import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  price: z.number().int().nonnegative(),
  qty: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  items: z.array(orderItemSchema).min(1).max(100),
  fulfillment: z.enum(["retiro", "delivery"]),
  payMethod: z.enum(["efectivo", "mp"]),
  customerName: z.string().trim().min(1).max(60),
  customerPhone: z.string().trim().min(6).max(30),
  customerAddress: z.string().trim().max(200).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pendiente", "confirmado", "en_preparacion", "listo", "entregado", "cancelado"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
