-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado');

-- CreateEnum
CREATE TYPE "OrderFulfillment" AS ENUM ('retiro', 'delivery');

-- CreateEnum
CREATE TYPE "OrderPayMethod" AS ENUM ('efectivo', 'mp');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "items" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "fulfillment" "OrderFulfillment" NOT NULL,
    "pay_method" "OrderPayMethod" NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_address" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_organization_id_status_idx" ON "orders"("organization_id", "status");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
