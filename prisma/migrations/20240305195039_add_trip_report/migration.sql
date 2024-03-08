/*
  Warnings:

  - Made the column `date` on table `TripExpense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `TripExpense` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TripExpense" ADD COLUMN     "tripReportId" INTEGER,
ALTER COLUMN "number" DROP NOT NULL,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "TripReport" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "TripReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TripExpense" ADD CONSTRAINT "TripExpense_tripReportId_fkey" FOREIGN KEY ("tripReportId") REFERENCES "TripReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
