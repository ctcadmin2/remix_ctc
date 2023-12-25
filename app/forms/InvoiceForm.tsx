import {
  Accordion,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  MultiSelect,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import CompanyList from "~/lists/CompanyList";
import SettingList from "~/lists/SettingList";
import type { LoaderData as editInvoice } from "~/routes/invoices.$invoiceId.edit";
import type { LoaderData as newInvoice } from "~/routes/invoices.new";

import {
  InvoiceFormProvider,
  useInvoiceForm,
} from "./utils/InvoiceFormContext";
import LineOrders from "./utils/LineOrders";

const InvoiceForm = () => {
  const { invoice, creditNotes, currencies, vatRates, clients } = useLoaderData<
    newInvoice & editInvoice
  >();

  const form = useInvoiceForm({
    initialValues: {
      number: invoice?.number || 0,
      date: dayjs(invoice?.date).toDate() || "",
      currency: invoice?.currency || "",
      vatRate: String(invoice?.vatRate) || "0",
      creditNotesIds: invoice?.creditNotes?.map((cn) => String(cn.id)) || [],
      clientId: invoice?.clientId || null,
      identification: invoice?.identification || {
        expName: "",
        expId: "",
        expVeh: "",
      },
      orders: invoice?.orders || [],
    },
  });
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const cnSelectData = () => {
    if (creditNotes) {
      console.log(creditNotes);
      const list = creditNotes.map((cn) => {
        return {
          value: String(cn.id),
          label: String(cn.number),
        };
      });

      return list;
    }
    return [];
  };

  return (
    <Box p={"sm"}>
      {/*TODO make responsive containers*/}
      <InvoiceFormProvider form={form}>
        <Form method="POST" reloadDocument navigate={false}>
          <AuthenticityTokenInput />
          <Flex direction={"row"} justify={"space-between"} align={"start"}>
            <div style={{ paddingRight: "24px", width: "100%" }}>
              <TextInput
                label="Number"
                name="number"
                required
                ref={ref}
                {...form.getInputProps("number")}
              />
              <CompanyList
                type="client"
                companies={clients}
                {...form.getInputProps("clientId")}
                required={true}
              />

              <DateInput
                label="Invoice date"
                name="date"
                withAsterisk
                {...form.getInputProps("date")}
                dateParser={(d) => {
                  console.log("d", d);
                  return new Date(1939, 8, 1);
                }}
              />

              <MultiSelect
                name="creditNotesIds"
                clearable
                searchable
                hidePickedOptions
                data={cnSelectData()}
                label="Credit Notes"
                {...form.getInputProps("creditNotesIds")}
                disabled={!(true && form.values.orders.length === 0)}
              />
              <SettingList
                setting={currencies}
                label="Currency"
                {...form.getInputProps("currency")}
                required
              />
              <SettingList
                setting={vatRates}
                label="Vat rate"
                {...form.getInputProps("vatRate")}
                required
              />
            </div>
            <Accordion style={{ width: "100%" }}>
              <Accordion.Item value="expData">
                <Accordion.Control>Expedition Info</Accordion.Control>
                <Accordion.Panel>
                  <TextInput
                    label="Buyer"
                    name="identification.expName"
                    {...form.getInputProps("identification.expName")}
                  />
                  <TextInput
                    label="Identification"
                    name="identification.expId"
                    {...form.getInputProps("identification.expId")}
                  />
                  <TextInput
                    label="Transport"
                    name="identification.expVeh"
                    {...form.getInputProps("identification.expVeh")}
                  />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="orders">
                <Accordion.Control>Orders</Accordion.Control>
                <Accordion.Panel>
                  <LineOrders
                    disabled={
                      !(true && form.values.creditNotesIds.length === 0)
                    }
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Flex>
          <Divider size={"sm"} mt="xl" mb="xl" />
          <Group justify="center" gap={"sm"}>
            <Button type="submit">Submit</Button>
            <Button type="reset" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Group>
        </Form>
      </InvoiceFormProvider>
    </Box>
  );
};

export default InvoiceForm;
