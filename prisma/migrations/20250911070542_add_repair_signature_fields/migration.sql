-- AlterTable
ALTER TABLE "public"."repair_works" ADD COLUMN     "customer_signature_url" TEXT,
ADD COLUMN     "customer_signed_at" TIMESTAMP(3),
ADD COLUMN     "customer_signer_name" TEXT;
