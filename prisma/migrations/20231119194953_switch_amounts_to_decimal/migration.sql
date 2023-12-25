/*
  Warnings:

  - You are about to alter the column `amount` on the `CreditNote` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `avans` on the `Indemnisation` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `rest` on the `Indemnisation` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `amount` on the `InternationalExpense` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `amount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `amount` on the `NationalExpense` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `value` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `totalRon` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `totalEur` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `amount` on the `TripExpense` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - You are about to alter the column `amountEur` on the `TripExpense` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal(14,4)`.
  - Made the column `totalEur` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CreditNote" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Indemnisation" ALTER COLUMN "avans" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "rest" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "InternationalExpense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "NationalExpense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "value" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "totalRon" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "totalEur" SET NOT NULL,
ALTER COLUMN "totalEur" SET DATA TYPE DECIMAL(14,4);

-- AlterTable
ALTER TABLE "TripExpense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,4),
ALTER COLUMN "amountEur" SET DATA TYPE DECIMAL(14,4);
