/*
  Warnings:

  - You are about to drop the column `contact_person` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `name_th` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "contact_person",
DROP COLUMN "name_th",
DROP COLUMN "phone";
