/*
  Warnings:

  - You are about to drop the column `cnp` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `totalEur` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `totalRon` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `Indemnisation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[ssn]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `Company` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ssn` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salaryEur` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salaryRon` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Indemnisation" DROP CONSTRAINT "Indemnisation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_employeeId_fkey";

-- DropIndex
DROP INDEX "Employee_cnp_key";

-- AlterTable
ALTER TABLE "Company" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "cnp",
ADD COLUMN     "ssn" TEXT NOT NULL,
ALTER COLUMN "activ" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "totalEur",
DROP COLUMN "totalRon",
ADD COLUMN     "salaryEur" DECIMAL(8,2) NOT NULL,
ADD COLUMN     "salaryRon" DECIMAL(8,2) NOT NULL;

-- DropTable
DROP TABLE "Indemnisation";

-- CreateTable
CREATE TABLE "Indemnization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "startDate" TIMESTAMP(3) NOT NULL,
    "perDay" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "avans" DECIMAL(8,2) NOT NULL,
    "rest" DECIMAL(8,2) NOT NULL,
    "total" DECIMAL(8,2) NOT NULL,
    "delegation" BOOLEAN NOT NULL,
    "paymentId" INTEGER,
    "createdAt" DATE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATE,

    CONSTRAINT "Indemnization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_ssn_key" ON "Employee"("ssn");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indemnization" ADD CONSTRAINT "Indemnization_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
