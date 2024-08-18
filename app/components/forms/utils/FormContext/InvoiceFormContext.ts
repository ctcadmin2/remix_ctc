import { createFormContext } from "@mantine/form";
import type Decimal from "decimal.js";

interface FormValues {
  number: string;
  date: Date;
  currency: string;
  vatRate: string;
  creditNotesIds: string[];
  clientId: number | null;
  paymentTerms: string;
  identification: {
    expName: string | null;
    expId: string | null;
    expVeh: string | null;
  } | null;
  orders: {
    id?: string;
    description: string;
    quantity: Decimal;
    amount: Decimal;
    total: Decimal;
  }[];
}
export const [InvoiceFormProvider, useInvoiceFormContext, useInvoiceForm] =
  createFormContext<FormValues>();
