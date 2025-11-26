-- AlterTable
ALTER TABLE "public"."repair_work_photos" ADD COLUMN     "repair_work_item_id" TEXT;

-- AddForeignKey
ALTER TABLE "public"."repair_work_photos" ADD CONSTRAINT "repair_work_photos_repair_work_item_id_fkey" FOREIGN KEY ("repair_work_item_id") REFERENCES "public"."repair_work_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
