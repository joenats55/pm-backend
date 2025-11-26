-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RepairPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "RepairItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "RepairPhotoType" AS ENUM ('BEFORE', 'AFTER', 'PROGRESS', 'DAMAGE', 'PARTS');

-- CreateTable
CREATE TABLE "repair_works" (
    "id" TEXT NOT NULL,
    "work_order_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "machine_id" TEXT NOT NULL,
    "pm_schedule_id" TEXT,
    "pm_result_id" TEXT,
    "priority" "RepairPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RepairStatus" NOT NULL DEFAULT 'OPEN',
    "reported_by" TEXT NOT NULL,
    "assigned_to" TEXT,
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_work_items" (
    "id" TEXT NOT NULL,
    "repair_work_id" TEXT NOT NULL,
    "item_order" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RepairItemStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repair_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_work_photos" (
    "id" TEXT NOT NULL,
    "repair_work_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "photo_type" "RepairPhotoType" NOT NULL,
    "description" TEXT,
    "taken_by" TEXT NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_work_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_work_parts" (
    "id" TEXT NOT NULL,
    "repair_work_id" TEXT NOT NULL,
    "machine_part_id" TEXT NOT NULL,
    "quantity_used" INTEGER NOT NULL,
    "cost_per_unit" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2),
    "used_by" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_work_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repair_works_work_order_number_key" ON "repair_works"("work_order_number");

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_pm_schedule_id_fkey" FOREIGN KEY ("pm_schedule_id") REFERENCES "pm_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_pm_result_id_fkey" FOREIGN KEY ("pm_result_id") REFERENCES "pm_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_works" ADD CONSTRAINT "repair_works_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_items" ADD CONSTRAINT "repair_work_items_repair_work_id_fkey" FOREIGN KEY ("repair_work_id") REFERENCES "repair_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_items" ADD CONSTRAINT "repair_work_items_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_items" ADD CONSTRAINT "repair_work_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_photos" ADD CONSTRAINT "repair_work_photos_repair_work_id_fkey" FOREIGN KEY ("repair_work_id") REFERENCES "repair_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_photos" ADD CONSTRAINT "repair_work_photos_taken_by_fkey" FOREIGN KEY ("taken_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_parts" ADD CONSTRAINT "repair_work_parts_repair_work_id_fkey" FOREIGN KEY ("repair_work_id") REFERENCES "repair_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_parts" ADD CONSTRAINT "repair_work_parts_machine_part_id_fkey" FOREIGN KEY ("machine_part_id") REFERENCES "machine_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_work_parts" ADD CONSTRAINT "repair_work_parts_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
