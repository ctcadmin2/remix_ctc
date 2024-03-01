import { createFormContext } from "@mantine/form";

interface FormValues {
  month: Date;
  salaryRon: string;
  indemnizations: {
    id?: string;
    period: [Date | null, Date | null];
    perDay: number;
    avans: number;
    delegation: boolean;
  }[];
}
export const [PaymentFormProvider, usePaymentFormContext, usePaymentForm] =
  createFormContext<FormValues>();
