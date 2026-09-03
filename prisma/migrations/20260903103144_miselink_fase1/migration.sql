-- CreateEnum
CREATE TYPE "MiseLinkItemType" AS ENUM ('link', 'header', 'collection', 'embed');

-- CreateTable
CREATE TABLE "miselink_pages" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "show_followers" BOOLEAN NOT NULL DEFAULT false,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miselink_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miselink_items" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "type" "MiseLinkItemType" NOT NULL DEFAULT 'link',
    "parent_id" UUID,
    "position" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "url" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "miselink_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "miselink_socials" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "network" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "miselink_socials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "miselink_pages_organization_id_key" ON "miselink_pages"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "miselink_pages_username_key" ON "miselink_pages"("username");

-- CreateIndex
CREATE INDEX "miselink_items_page_id_position_idx" ON "miselink_items"("page_id", "position");

-- CreateIndex
CREATE INDEX "miselink_socials_page_id_position_idx" ON "miselink_socials"("page_id", "position");

-- AddForeignKey
ALTER TABLE "miselink_pages" ADD CONSTRAINT "miselink_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miselink_items" ADD CONSTRAINT "miselink_items_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "miselink_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "miselink_socials" ADD CONSTRAINT "miselink_socials_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "miselink_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

