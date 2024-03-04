import { createFormContext } from "@mantine/form";

interface FormValues {
  number: string;
  date: Date;
  currency: string;
  vatRate: string;
  creditNotesIds: string[];
  clientId: number | null;
  identification: {
    expName: string | null;
    expId: string | null;
    expVeh: string | null;
  } | null;
  orders: {
    id?: string;
    description: string;
    quantity: number;
    amount: string;
    total: string;
  }[];
}
export const [InvoiceFormProvider, useInvoiceFormContext, useInvoiceForm] =
  createFormContext<FormValues>();
