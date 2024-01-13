-- DropIndex
DROP INDEX "Invoice_number_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "bnr" TEXT,
ADD COLUMN     "bnrAt" DATE;
