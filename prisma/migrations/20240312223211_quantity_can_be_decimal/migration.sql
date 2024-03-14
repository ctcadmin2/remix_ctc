/*
  Warnings:

  - You are about to alter the column `quantity` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(8,2)`.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(8,2);
