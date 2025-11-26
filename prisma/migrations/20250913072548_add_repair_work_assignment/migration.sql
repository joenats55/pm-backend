-- CreateTable
CREATE TABLE "public"."repair_work_assignments" (
    "id" TEXT NOT NULL,
    "repair_work_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,

    CONSTRAINT "repair_work_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repair_work_assignments_repair_work_id_user_id_key" ON "public"."repair_work_assignments"("repair_work_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."repair_work_assignments" ADD CONSTRAINT "repair_work_assignments_repair_work_id_fkey" FOREIGN KEY ("repair_work_id") REFERENCES "public"."repair_works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repair_work_assignments" ADD CONSTRAINT "repair_work_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."repair_work_assignments" ADD CONSTRAINT "repair_work_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
