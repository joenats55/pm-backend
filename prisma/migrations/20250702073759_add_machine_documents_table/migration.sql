-- CreateTable
CREATE TABLE "machine_documents" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "version" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "machine_documents" ADD CONSTRAINT "machine_documents_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
