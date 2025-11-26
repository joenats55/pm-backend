-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "address_id" INTEGER,
ADD COLUMN     "amphures_id" INTEGER,
ADD COLUMN     "detail" TEXT,
ADD COLUMN     "districts_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name_th" TEXT,
ADD COLUMN     "provinces_id" INTEGER,
ADD COLUMN     "regis_capital" BIGINT,
ADD COLUMN     "regis_date" TIMESTAMP(3),
ADD COLUMN     "regis_number" TEXT,
ADD COLUMN     "tel" TEXT,
ADD COLUMN     "zip_code" INTEGER;
