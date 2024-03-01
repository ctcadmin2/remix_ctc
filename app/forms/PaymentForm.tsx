import {
  Box,
  Button,
  Divider,
  Group,
  ScrollArea,
  TextInput,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { useRef, useEffect } from "react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import { loader as editLoader } from "~/routes/employees.$employeeId.payments.$paymentId.edit";
import { loader as newLoader } from "~/routes/employees.$employeeId.payments.new";

import IndemnizationForm from "./IndemnizationForm";
import {
  PaymentFormProvider,
  usePaymentForm,
} from "./utils/FormContext/PaymentFormContext";

const PaymentForm = () => {
  const { payment, settings } = useLoaderData<
    typeof newLoader | typeof editLoader
  >();

  const form = usePaymentForm({
    initialValues: {
      month: dayjs(payment?.month).toDate() ?? new Date(Date.now()),
      salaryRon: payment?.salaryRon ?? settings?.salary ?? "0",
      indemnizations: payment?.indemnizations ?? [],
    },
  });

  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

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
                // ref={ref}
                {...form.getInputProps("month")}
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
                  perDay: parseInt(settings?.perDay) ?? 0,
                  avans: 200,
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
