-- CreateEnum
CREATE TYPE "eStatus" AS ENUM ('nproc', 'validated', 'invalid');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "county" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "paymentTerms" TEXT NOT NULL DEFAULT '30 de zile';

-- CreateTable
CREATE TABLE "EFactura" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "xml" XML,
    "loadIndex" TEXT,
    "status" "eStatus" NOT NULL DEFAULT 'nproc',
    "invoiceId" INTEGER,
    "nationalExpenseId" INTEGER,

    CONSTRAINT "EFactura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EFactura_invoiceId_key" ON "EFactura"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EFactura_nationalExpenseId_key" ON "EFactura"("nationalExpenseId");

-- AddForeignKey
ALTER TABLE "EFactura" ADD CONSTRAINT "EFactura_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EFactura" ADD CONSTRAINT "EFactura_nationalExpenseId_fkey" FOREIGN KEY ("nationalExpenseId") REFERENCES "NationalExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
