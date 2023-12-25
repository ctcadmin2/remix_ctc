-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_invoiceId_fkey";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
