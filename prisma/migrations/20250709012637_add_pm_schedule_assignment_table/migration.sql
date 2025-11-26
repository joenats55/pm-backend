-- DropForeignKey
ALTER TABLE "pm_schedules" DROP CONSTRAINT "pm_schedules_assigned_to_fkey";

-- CreateTable
CREATE TABLE "pm_schedule_assignments" (
    "id" TEXT NOT NULL,
    "pm_schedule_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "pm_schedule_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pm_schedule_assignments_pm_schedule_id_user_id_key" ON "pm_schedule_assignments"("pm_schedule_id", "user_id");

-- AddForeignKey
ALTER TABLE "pm_schedule_assignments" ADD CONSTRAINT "pm_schedule_assignments_pm_schedule_id_fkey" FOREIGN KEY ("pm_schedule_id") REFERENCES "pm_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedule_assignments" ADD CONSTRAINT "pm_schedule_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedule_assignments" ADD CONSTRAINT "pm_schedule_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
