/*
  Warnings:

  - You are about to drop the `pm_schedule_drafts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pm_schedule_drafts" DROP CONSTRAINT "pm_schedule_drafts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "pm_schedule_drafts" DROP CONSTRAINT "pm_schedule_drafts_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "pm_schedule_drafts" DROP CONSTRAINT "pm_schedule_drafts_updated_by_fkey";

-- DropTable
DROP TABLE "pm_schedule_drafts";
