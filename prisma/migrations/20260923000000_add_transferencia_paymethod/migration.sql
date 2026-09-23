-- AlterEnum: agrega "transferencia" a OrderPayMethod (reemplaza a "mp"/Mercado Pago en el checkout).
-- "mp" se conserva como valor legacy para no romper pedidos viejos.
ALTER TYPE "OrderPayMethod" ADD VALUE IF NOT EXISTS 'transferencia';
