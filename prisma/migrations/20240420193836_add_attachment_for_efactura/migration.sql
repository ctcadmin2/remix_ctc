/*
  Warnings:

  - You are about to drop the column `loadIndex` on the `EFactura` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eFacturaId]` on the table `Attachment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uploadId]` on the table `EFactura` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[downloadId]` on the table `EFactura` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Attachment_id_type_key";

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "eFacturaId" UUID;

-- AlterTable
ALTER TABLE "EFactura" DROP COLUMN "loadIndex",
ADD COLUMN     "uploadId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_eFacturaId_key" ON "Attachment"("eFacturaId");

-- CreateIndex
CREATE UNIQUE INDEX "EFactura_uploadId_key" ON "EFactura"("uploadId");

-- CreateIndex
CREATE UNIQUE INDEX "EFactura_downloadId_key" ON "EFactura"("downloadId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_eFacturaId_fkey" FOREIGN KEY ("eFacturaId") REFERENCES "EFactura"("id") ON DELETE CASCADE ON UPDATE CASCADE;
