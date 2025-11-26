/*
  Warnings:

  - You are about to drop the column `pm_result_id` on the `repair_works` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."repair_works" DROP CONSTRAINT "repair_works_pm_result_id_fkey";

-- AlterTable
ALTER TABLE "public"."repair_works" DROP COLUMN "pm_result_id";
