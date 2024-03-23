import { createFormContext } from "@mantine/form";
import type Decimal from "decimal.js";

export interface FormValues {
  month: Date;
  salaryRon: string;
  indemnizations: {
    id?: string;
    period: [Date | null, Date | null];
    perDay: number;
    avans: Decimal;
    delegation: boolean;
  }[];
}
export const [PaymentFormProvider, usePaymentFormContext, usePaymentForm] =
  createFormContext<FormValues>();
