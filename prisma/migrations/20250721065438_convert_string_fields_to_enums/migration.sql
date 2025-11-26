/*
  Warnings:

  - Converting string fields to enum types with data migration
  - This migration preserves existing data by mapping values to enum equivalents

*/
-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MANUAL', 'WARRANTY', 'CERTIFICATE', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT', 'ADJUST');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('WORK_ORDER', 'MANUAL', 'PURCHASE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PMScheduleStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PMPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PMResultStatus" AS ENUM ('NORMAL', 'ABNORMAL', 'NEEDS_REPAIR', 'NOT_CHECKABLE');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'EVIDENCE', 'REFERENCE');

-- Step 1: Add temporary columns
ALTER TABLE "machines" ADD COLUMN "status_new" "MachineStatus";
ALTER TABLE "machine_documents" ADD COLUMN "document_type_new" "DocumentType";
ALTER TABLE "inventory_transactions" ADD COLUMN "transaction_type_new" "TransactionType";
ALTER TABLE "inventory_transactions" ADD COLUMN "reference_type_new" "ReferenceType";
ALTER TABLE "pm_templates" ADD COLUMN "frequency_type_new" "FrequencyType";
ALTER TABLE "pm_schedules" ADD COLUMN "status_new" "PMScheduleStatus";
ALTER TABLE "pm_schedules" ADD COLUMN "priority_new" "PMPriority";
ALTER TABLE "pm_result_photos" ADD COLUMN "photo_type_new" "PhotoType";

-- Step 2: Migrate data with proper mapping
UPDATE "machines" SET "status_new" = 
  CASE 
    WHEN "status" = 'active' THEN 'ACTIVE'::"MachineStatus"
    WHEN "status" = 'maintenance' THEN 'MAINTENANCE'::"MachineStatus"
    WHEN "status" = 'inactive' THEN 'INACTIVE'::"MachineStatus"
    WHEN "status" = 'retired' THEN 'RETIRED'::"MachineStatus"
    ELSE 'ACTIVE'::"MachineStatus"
  END;

UPDATE "machine_documents" SET "document_type_new" = 
  CASE 
    WHEN "document_type" = 'manual' THEN 'MANUAL'::"DocumentType"
    WHEN "document_type" = 'warranty' THEN 'WARRANTY'::"DocumentType"
    WHEN "document_type" = 'certificate' THEN 'CERTIFICATE'::"DocumentType"
    WHEN "document_type" = 'maintenance' THEN 'MAINTENANCE'::"DocumentType"
    ELSE 'OTHER'::"DocumentType"
  END;

UPDATE "inventory_transactions" SET "transaction_type_new" = 
  CASE 
    WHEN "transaction_type" = 'IN' THEN 'IN'::"TransactionType"
    WHEN "transaction_type" = 'OUT' THEN 'OUT'::"TransactionType"
    WHEN "transaction_type" = 'ADJUST' THEN 'ADJUST'::"TransactionType"
    ELSE 'IN'::"TransactionType"
  END;

UPDATE "inventory_transactions" SET "reference_type_new" = 
  CASE 
    WHEN "reference_type" = 'work_order' THEN 'WORK_ORDER'::"ReferenceType"
    WHEN "reference_type" = 'manual' THEN 'MANUAL'::"ReferenceType"
    WHEN "reference_type" = 'purchase' THEN 'PURCHASE'::"ReferenceType"
    WHEN "reference_type" = 'adjustment' THEN 'ADJUSTMENT'::"ReferenceType"
    ELSE NULL
  END;

UPDATE "pm_templates" SET "frequency_type_new" = 
  CASE 
    WHEN "frequency_type" = 'hourly' THEN 'HOURLY'::"FrequencyType"
    WHEN "frequency_type" = 'daily' THEN 'DAILY'::"FrequencyType"
    WHEN "frequency_type" = 'weekly' THEN 'WEEKLY'::"FrequencyType"
    WHEN "frequency_type" = 'monthly' THEN 'MONTHLY'::"FrequencyType"
    ELSE 'MONTHLY'::"FrequencyType"
  END;

UPDATE "pm_schedules" SET "status_new" = 
  CASE 
    WHEN "status" = 'scheduled' THEN 'SCHEDULED'::"PMScheduleStatus"
    WHEN "status" = 'in_progress' THEN 'IN_PROGRESS'::"PMScheduleStatus"
    WHEN "status" = 'completed' THEN 'COMPLETED'::"PMScheduleStatus"
    WHEN "status" = 'skipped' THEN 'SKIPPED'::"PMScheduleStatus"
    WHEN "status" = 'overdue' THEN 'OVERDUE'::"PMScheduleStatus"
    WHEN "status" = 'cancelled' THEN 'CANCELLED'::"PMScheduleStatus"
    ELSE 'SCHEDULED'::"PMScheduleStatus"
  END;

UPDATE "pm_schedules" SET "priority_new" = 
  CASE 
    WHEN "priority" = 'low' THEN 'LOW'::"PMPriority"
    WHEN "priority" = 'medium' THEN 'MEDIUM'::"PMPriority"
    WHEN "priority" = 'high' THEN 'HIGH'::"PMPriority"
    WHEN "priority" = 'critical' THEN 'CRITICAL'::"PMPriority"
    ELSE 'MEDIUM'::"PMPriority"
  END;

UPDATE "pm_result_photos" SET "photo_type_new" = 
  CASE 
    WHEN "photo_type" = 'before' THEN 'BEFORE'::"PhotoType"
    WHEN "photo_type" = 'after' THEN 'AFTER'::"PhotoType"
    WHEN "photo_type" = 'evidence' THEN 'EVIDENCE'::"PhotoType"
    WHEN "photo_type" = 'reference' THEN 'REFERENCE'::"PhotoType"
    ELSE 'EVIDENCE'::"PhotoType"
  END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE "machines" DROP COLUMN "status";
ALTER TABLE "machines" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "machines" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "machines" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

ALTER TABLE "machine_documents" DROP COLUMN "document_type";
ALTER TABLE "machine_documents" RENAME COLUMN "document_type_new" TO "document_type";
ALTER TABLE "machine_documents" ALTER COLUMN "document_type" SET NOT NULL;

ALTER TABLE "inventory_transactions" DROP COLUMN "transaction_type";
ALTER TABLE "inventory_transactions" RENAME COLUMN "transaction_type_new" TO "transaction_type";
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_type" SET NOT NULL;

ALTER TABLE "inventory_transactions" DROP COLUMN "reference_type";
ALTER TABLE "inventory_transactions" RENAME COLUMN "reference_type_new" TO "reference_type";

ALTER TABLE "pm_templates" DROP COLUMN "frequency_type";
ALTER TABLE "pm_templates" RENAME COLUMN "frequency_type_new" TO "frequency_type";
ALTER TABLE "pm_templates" ALTER COLUMN "frequency_type" SET NOT NULL;

ALTER TABLE "pm_schedules" DROP COLUMN "status";
ALTER TABLE "pm_schedules" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "pm_schedules" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "pm_schedules" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

ALTER TABLE "pm_schedules" DROP COLUMN "priority";
ALTER TABLE "pm_schedules" RENAME COLUMN "priority_new" TO "priority";
ALTER TABLE "pm_schedules" ALTER COLUMN "priority" SET NOT NULL;
ALTER TABLE "pm_schedules" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

ALTER TABLE "pm_result_photos" DROP COLUMN "photo_type";
ALTER TABLE "pm_result_photos" RENAME COLUMN "photo_type_new" TO "photo_type";
ALTER TABLE "pm_result_photos" ALTER COLUMN "photo_type" SET NOT NULL;

-- Create indexes
CREATE INDEX "inventory_transactions_transaction_type_idx" ON "inventory_transactions"("transaction_type");
