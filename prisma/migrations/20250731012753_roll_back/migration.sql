/*
  Warnings:

  - You are about to drop the `maintenance_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_item_part_usage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_item_photos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_part_usage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `maintenance_photos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "maintenance_documents" DROP CONSTRAINT "maintenance_documents_maintenance_order_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_documents" DROP CONSTRAINT "maintenance_documents_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_item_part_usage" DROP CONSTRAINT "maintenance_item_part_usage_maintenance_item_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_item_part_usage" DROP CONSTRAINT "maintenance_item_part_usage_part_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_item_part_usage" DROP CONSTRAINT "maintenance_item_part_usage_withdrawn_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_item_photos" DROP CONSTRAINT "maintenance_item_photos_maintenance_item_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_item_photos" DROP CONSTRAINT "maintenance_item_photos_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_order_items" DROP CONSTRAINT "maintenance_order_items_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_order_items" DROP CONSTRAINT "maintenance_order_items_completed_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_order_items" DROP CONSTRAINT "maintenance_order_items_maintenance_order_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_order_items" DROP CONSTRAINT "maintenance_order_items_quality_checked_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_assigned_to_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_completed_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_machine_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_pm_result_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_pm_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_orders" DROP CONSTRAINT "maintenance_orders_reported_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_part_usage" DROP CONSTRAINT "maintenance_part_usage_maintenance_order_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_part_usage" DROP CONSTRAINT "maintenance_part_usage_part_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_part_usage" DROP CONSTRAINT "maintenance_part_usage_withdrawn_by_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_photos" DROP CONSTRAINT "maintenance_photos_maintenance_order_id_fkey";

-- DropForeignKey
ALTER TABLE "maintenance_photos" DROP CONSTRAINT "maintenance_photos_uploaded_by_fkey";

-- DropTable
DROP TABLE "maintenance_documents";

-- DropTable
DROP TABLE "maintenance_item_part_usage";

-- DropTable
DROP TABLE "maintenance_item_photos";

-- DropTable
DROP TABLE "maintenance_order_items";

-- DropTable
DROP TABLE "maintenance_orders";

-- DropTable
DROP TABLE "maintenance_part_usage";

-- DropTable
DROP TABLE "maintenance_photos";

-- DropEnum
DROP TYPE "MaintenanceDocumentType";

-- DropEnum
DROP TYPE "MaintenanceItemStatus";

-- DropEnum
DROP TYPE "MaintenancePhotoType";

-- DropEnum
DROP TYPE "MaintenancePriority";

-- DropEnum
DROP TYPE "MaintenanceStatus";

-- DropEnum
DROP TYPE "ProblemType";

-- DropEnum
DROP TYPE "UrgencyType";
