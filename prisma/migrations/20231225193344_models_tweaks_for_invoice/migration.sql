/*
  Warnings:

  - You are about to drop the column `paid` on the `CreditNote` table. All the data in the column will be lost.
  - The primary key for the `Identification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `buyer` on the `Identification` table. All the data in the column will be lost.
  - You are about to drop the column `indentification` on the `Identification` table. All the data in the column will be lost.
  - You are about to drop the column `transport` on the `Identification` table. All the data in the column will be lost.
  - The `id` column on the `Identification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[number]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `number` on the `Invoice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Identification" DROP CONSTRAINT "Identification_invoiceId_fkey";

-- AlterTable
ALTER TABLE "CreditNote" DROP COLUMN "paid";

-- AlterTable
ALTER TABLE "Identification" DROP CONSTRAINT "Identification_pkey",
DROP COLUMN "buyer",
DROP COLUMN "indentification",
DROP COLUMN "transport",
ADD COLUMN     "expId" TEXT,
ADD COLUMN     "expName" TEXT,
ADD COLUMN     "expVeh" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Identification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "number",
ADD COLUMN     "number" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "Identification" ADD CONSTRAINT "Identification_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
