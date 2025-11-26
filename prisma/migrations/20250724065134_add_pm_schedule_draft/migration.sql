-- CreateTable
CREATE TABLE "pm_schedule_drafts" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "draft_data" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_schedule_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pm_schedule_drafts_schedule_id_key" ON "pm_schedule_drafts"("schedule_id");

-- AddForeignKey
ALTER TABLE "pm_schedule_drafts" ADD CONSTRAINT "pm_schedule_drafts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "pm_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedule_drafts" ADD CONSTRAINT "pm_schedule_drafts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedule_drafts" ADD CONSTRAINT "pm_schedule_drafts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
