-- CreateTable
CREATE TABLE "pm_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "machine_type" TEXT,
    "frequency_type" TEXT NOT NULL,
    "frequency_value" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "standard" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_template_items" (
    "id" TEXT NOT NULL,
    "pm_template_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "check_item" TEXT NOT NULL,
    "category" TEXT,
    "standard_value" TEXT,
    "unit" TEXT,
    "method" TEXT,
    "tools_required" TEXT,
    "image_url" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "has_signature" BOOLEAN NOT NULL DEFAULT false,
    "has_photo" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "pm_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_schedules" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "pm_template_id" TEXT,
    "schedule_code" TEXT NOT NULL,
    "next_due_date" TIMESTAMP(3) NOT NULL,
    "last_done_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "estimated_hours" DOUBLE PRECISION,
    "actual_hours" DOUBLE PRECISION,
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_results" (
    "id" TEXT NOT NULL,
    "pm_schedule_id" TEXT NOT NULL,
    "pm_template_item_id" TEXT NOT NULL,
    "result" TEXT,
    "measured_value" TEXT,
    "is_within_standard" BOOLEAN,
    "photo_url" TEXT,
    "signature_url" TEXT,
    "checked_by" TEXT,
    "checked_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pm_schedules_schedule_code_key" ON "pm_schedules"("schedule_code");

-- AddForeignKey
ALTER TABLE "pm_templates" ADD CONSTRAINT "pm_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_template_items" ADD CONSTRAINT "pm_template_items_pm_template_id_fkey" FOREIGN KEY ("pm_template_id") REFERENCES "pm_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_pm_template_id_fkey" FOREIGN KEY ("pm_template_id") REFERENCES "pm_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_schedules" ADD CONSTRAINT "pm_schedules_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_results" ADD CONSTRAINT "pm_results_pm_schedule_id_fkey" FOREIGN KEY ("pm_schedule_id") REFERENCES "pm_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_results" ADD CONSTRAINT "pm_results_pm_template_item_id_fkey" FOREIGN KEY ("pm_template_item_id") REFERENCES "pm_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_results" ADD CONSTRAINT "pm_results_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_results" ADD CONSTRAINT "pm_results_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
