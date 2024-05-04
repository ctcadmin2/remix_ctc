/*
  Warnings:

  - You are about to drop the column `nationalExpenseId` on the `EFactura` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[expenseId]` on the table `EFactura` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "EFactura" DROP CONSTRAINT "EFactura_nationalExpenseId_fkey";

-- DropIndex
DROP INDEX "EFactura_nationalExpenseId_key";

-- AlterTable
ALTER TABLE "EFactura" DROP COLUMN "nationalExpenseId",
ADD COLUMN     "expenseId" INTEGER;

-- AlterTable
ALTER TABLE "NationalExpense" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "messageId" UUID;

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "createdAt" DATE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EFactura_expenseId_key" ON "EFactura"("expenseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EFactura" ADD CONSTRAINT "EFactura_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "NationalExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
