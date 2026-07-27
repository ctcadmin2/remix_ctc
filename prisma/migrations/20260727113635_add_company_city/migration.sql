/*
  Warnings:

  - A unique constraint covering the columns `[shippingNr]` on the table `CreditNote` will be added. If there are existing duplicate values, this will fail.
  - Made the column `address` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Made the column `county` on table `Company` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "address" SET DEFAULT '',
ALTER COLUMN "country" SET DEFAULT '',
ALTER COLUMN "county" SET NOT NULL,
ALTER COLUMN "county" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_shippingNr_key" ON "CreditNote"("shippingNr");
