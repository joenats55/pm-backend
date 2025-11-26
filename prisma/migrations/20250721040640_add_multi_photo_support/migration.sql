-- AlterTable
ALTER TABLE "pm_results" ADD COLUMN     "after_photos" TEXT[],
ADD COLUMN     "before_photos" TEXT[];

-- CreateTable
CREATE TABLE "pm_result_photos" (
    "id" TEXT NOT NULL,
    "pm_result_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "description" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_result_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pm_result_photos" ADD CONSTRAINT "pm_result_photos_pm_result_id_fkey" FOREIGN KEY ("pm_result_id") REFERENCES "pm_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_result_photos" ADD CONSTRAINT "pm_result_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
