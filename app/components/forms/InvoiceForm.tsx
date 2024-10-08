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
import { Form, useNavigate } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import CompanyList, {
  type CompaniesListType,
} from "~/components/lists/CompanyList";
import SettingList from "~/components/lists/SettingList";
import type {
  InvoiceCreditNoteType,
  InvoiceType,
} from "~/routes/invoices.$invoiceId.edit";

import { useEffect, useRef } from "react";
import {
  InvoiceFormProvider,
  useInvoiceForm,
} from "./utils/FormContext/InvoiceFormContext";
import LineOrders from "./utils/LineOrders";

interface Props {
  invoice?: InvoiceType | null;
  creditNotes: InvoiceCreditNoteType[];
  currencies: string[];
  vatRates: string[];
  clients: CompaniesListType[];
}

const InvoiceForm = ({
  invoice = null,
  creditNotes,
  currencies,
  vatRates,
  clients,
}: Props): JSX.Element => {
  const form = useInvoiceForm({
    initialValues: {
      number: invoice?.number || "",
      date: new Date(invoice?.date ?? Date.now()),
      currency: invoice?.currency ?? "",
      vatRate: String(invoice?.vatRate) ?? "0",
      creditNotesIds: invoice?.creditNotes?.map((cn) => String(cn.id)) || [],
      clientId: invoice?.clientId ?? null,
      paymentTerms: invoice?.paymentTerms ?? "",
      identification: invoice?.identification ?? {
        expName: "",
        expId: "",
        expVeh: "",
      },
      orders: invoice?.orders ?? [],
    },
  });
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref) {
      ref.current?.select();
    }
  }, []);

  const cnSelectData = () => {
    if (creditNotes) {
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
                py={"0.25rem"}
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
              <TextInput
                label="Payment terms"
                name="paymentTerms"
                required
                {...form.getInputProps("paymentTerms")}
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
