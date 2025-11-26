/*
  Warnings:

  - You are about to drop the column `after_photos` on the `pm_results` table. All the data in the column will be lost.
  - You are about to drop the column `before_photos` on the `pm_results` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pm_results" DROP COLUMN "after_photos",
DROP COLUMN "before_photos";
