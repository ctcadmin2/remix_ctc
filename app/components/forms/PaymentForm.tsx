import {
  Box,
  Button,
  Divider,
  Group,
  ScrollArea,
  TextInput,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import type { Indemnization } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import type { PaymentType } from "~/routes/employees.$employeeId.payments.$paymentId.edit";

import IndemnizationForm from "./IndemnizationForm";
import {
  type FormValues,
  PaymentFormProvider,
  usePaymentForm,
} from "./utils/FormContext/PaymentFormContext";

interface Props {
  payment?: PaymentType | null;
  perDay: string;
  salary: string;
}

const prepIndemization = (indemnizations: Indemnization[]) => {
  const data: FormValues["indemnizations"] = indemnizations.map((i) => {
    const { startDate, days, ...rest } = i;
    return {
      ...rest,
      period: [
        new Date(startDate),
        new Date(
          dayjs(startDate)
            .add(days - 1, "day")
            .toDate(),
        ),
      ],
    };
  });
  return data;
};

const PaymentForm = ({
  payment = null,
  perDay,
  salary,
}: Props): JSX.Element => {
  const form = usePaymentForm({
    initialValues: {
      month: new Date(payment?.month ?? Date.now()),
      salaryRon: payment?.salaryRon.toString() ?? salary ?? "0",
      indemnizations: payment?.indemnizations
        ? prepIndemization(payment.indemnizations)
        : [],
    },
  });

  const navigate = useNavigate();

  return (
    <Box p={"sm"}>
      <PaymentFormProvider form={form}>
        <Form method="post" reloadDocument aria-readonly>
          <AuthenticityTokenInput />
          <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
            <div style={{ paddingRight: "24px" }}>
              <MonthPickerInput
                label="Month"
                name="month"
                required
                {...form.getInputProps("month")}
                py={"0.25rem"}
              />
              <TextInput
                label="Salariu RON"
                name="salaryRon"
                required
                {...form.getInputProps("salaryRon")}
              />
              {form.values.indemnizations.length > 0 ? (
                <IndemnizationForm />
              ) : null}
            </div>
          </ScrollArea.Autosize>
          <Divider size={"sm"} mt="xl" mb="xl" />
          <Group justify="center" gap={"sm"}>
            <Button type="submit">Submit</Button>
            <Button
              onClick={() =>
                form.insertListItem("indemnizations", {
                  period: [null, null],
                  perDay: Number.parseInt(perDay) ?? 0,
                  avans: 0,
                  delegation: false,
                })
              }
            >
              Add indemnization...
            </Button>
            <Button color="red" type="reset" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Group>
        </Form>
      </PaymentFormProvider>
    </Box>
  );
};
export default PaymentForm;
