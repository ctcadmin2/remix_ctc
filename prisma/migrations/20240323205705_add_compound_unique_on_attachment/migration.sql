/*
  Warnings:

  - A unique constraint covering the columns `[id,type]` on the table `Attachment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Attachment_id_type_key" ON "Attachment"("id", "type");
