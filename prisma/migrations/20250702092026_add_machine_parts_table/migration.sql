-- CreateTable
CREATE TABLE "machine_parts" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "part_code" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "description" TEXT,
    "part_category" TEXT,
    "uom" TEXT NOT NULL DEFAULT 'pcs',
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "min_stock_level" INTEGER,
    "location" TEXT,
    "vendor_name" TEXT,
    "cost_per_unit" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machine_parts_machine_id_idx" ON "machine_parts"("machine_id");

-- CreateIndex
CREATE INDEX "machine_parts_part_code_idx" ON "machine_parts"("part_code");

-- CreateIndex
CREATE UNIQUE INDEX "machine_parts_machine_id_part_code_key" ON "machine_parts"("machine_id", "part_code");

-- AddForeignKey
ALTER TABLE "machine_parts" ADD CONSTRAINT "machine_parts_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
