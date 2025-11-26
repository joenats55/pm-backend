-- AlterTable
ALTER TABLE "public"."repair_works" ADD COLUMN     "completed_by" TEXT;

-- AddForeignKey
ALTER TABLE "public"."repair_works" ADD CONSTRAINT "repair_works_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
