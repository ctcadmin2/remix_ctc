/*
  Warnings:

  - You are about to drop the column `identificationId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Order` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "identificationId";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "value",
ADD COLUMN     "amount" DECIMAL(8,2) NOT NULL;
