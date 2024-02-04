/*
  Warnings:

  - A unique constraint covering the columns `[vatNumber]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "InternationalExpense" DROP CONSTRAINT "InternationalExpense_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_clientId_fkey";

-- DropForeignKey
ALTER TABLE "NationalExpense" DROP CONSTRAINT "NationalExpense_supplierId_fkey";

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "vatValid" DROP NOT NULL,
ALTER COLUMN "capital" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Company_vatNumber_key" ON "Company"("vatNumber");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NationalExpense" ADD CONSTRAINT "NationalExpense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternationalExpense" ADD CONSTRAINT "InternationalExpense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
