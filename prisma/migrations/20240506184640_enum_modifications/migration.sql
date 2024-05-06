/*
  Warnings:

  - The `status` column on the `EFactura` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Attachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EStatus" AS ENUM ('nproc', 'validated', 'uploaded', 'invalid', 'valid', 'store');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('creditNote', 'internationalExpense', 'nationalExpense', 'tripExpense', 'document', 'eFactura');

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "type",
ADD COLUMN     "type" "AttachmentType" NOT NULL;

-- AlterTable
ALTER TABLE "EFactura" DROP COLUMN "status",
ADD COLUMN     "status" "EStatus" NOT NULL DEFAULT 'nproc';

-- DropEnum
DROP TYPE "eStatus";
