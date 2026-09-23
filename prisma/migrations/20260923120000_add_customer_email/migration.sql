-- AlterTable: agrega "customer_email" (opcional) a "orders" para matching de clientes.
ALTER TABLE "orders" ADD COLUMN "customer_email" TEXT;

-- CreateIndex: búsqueda de clientes por teléfono dentro de la org.
CREATE INDEX "orders_organization_id_customer_phone_idx" ON "orders"("organization_id", "customer_phone");

-- CreateIndex: búsqueda de clientes por email dentro de la org.
CREATE INDEX "orders_organization_id_customer_email_idx" ON "orders"("organization_id", "customer_email");
