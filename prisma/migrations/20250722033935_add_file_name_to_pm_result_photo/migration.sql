/*
  Warnings:

  - You are about to drop the column `file_size` on the `pm_result_photos` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_at` on the `pm_result_photos` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_by` on the `pm_result_photos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pm_result_photos" DROP CONSTRAINT "pm_result_photos_uploaded_by_fkey";

-- AlterTable
ALTER TABLE "pm_result_photos" DROP COLUMN "file_size",
DROP COLUMN "uploaded_at",
DROP COLUMN "uploaded_by";
