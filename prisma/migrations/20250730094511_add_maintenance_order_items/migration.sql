-- CreateEnum
CREATE TYPE "MaintenanceItemStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD', 'QUALITY_CHECK');

-- CreateTable
CREATE TABLE "maintenance_order_items" (
    "id" TEXT NOT NULL,
    "maintenance_order_id" TEXT NOT NULL,
    "item_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceItemStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "work_performed" TEXT,
    "solution" TEXT,
    "completed_by" TEXT,
    "is_quality_checked" BOOLEAN NOT NULL DEFAULT false,
    "quality_checked_by" TEXT,
    "quality_checked_at" TIMESTAMP(3),
    "quality_remarks" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_item_part_usage" (
    "id" TEXT NOT NULL,
    "maintenance_item_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "quantity_used" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "withdrawn_by" TEXT NOT NULL,
    "withdrawn_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "maintenance_item_part_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_item_photos" (
    "id" TEXT NOT NULL,
    "maintenance_item_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "photo_type" "MaintenancePhotoType" NOT NULL,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_item_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_order_items_maintenance_order_id_item_order_key" ON "maintenance_order_items"("maintenance_order_id", "item_order");

-- AddForeignKey
ALTER TABLE "maintenance_order_items" ADD CONSTRAINT "maintenance_order_items_maintenance_order_id_fkey" FOREIGN KEY ("maintenance_order_id") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_order_items" ADD CONSTRAINT "maintenance_order_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_order_items" ADD CONSTRAINT "maintenance_order_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_order_items" ADD CONSTRAINT "maintenance_order_items_quality_checked_by_fkey" FOREIGN KEY ("quality_checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_item_part_usage" ADD CONSTRAINT "maintenance_item_part_usage_maintenance_item_id_fkey" FOREIGN KEY ("maintenance_item_id") REFERENCES "maintenance_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_item_part_usage" ADD CONSTRAINT "maintenance_item_part_usage_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "machine_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_item_part_usage" ADD CONSTRAINT "maintenance_item_part_usage_withdrawn_by_fkey" FOREIGN KEY ("withdrawn_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_item_photos" ADD CONSTRAINT "maintenance_item_photos_maintenance_item_id_fkey" FOREIGN KEY ("maintenance_item_id") REFERENCES "maintenance_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_item_photos" ADD CONSTRAINT "maintenance_item_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
