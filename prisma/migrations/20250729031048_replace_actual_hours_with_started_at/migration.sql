/*
  Warnings:

  - You are about to drop the column `actual_hours` on the `pm_schedules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pm_schedules" DROP COLUMN "actual_hours",
ADD COLUMN     "started_at" TIMESTAMP(3);
