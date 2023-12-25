/*
  Warnings:

  - You are about to alter the column `amount` on the `CreditNote` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,4)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "CreditNote" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);
