-- AlterTable
ALTER TABLE "CreditNote" ADD COLUMN     "shippingNr" INTEGER;

-- AlterTable
ALTER TABLE "_MessageToUser" ADD CONSTRAINT "_MessageToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_MessageToUser_AB_unique";
