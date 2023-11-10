import { useEffect, useRef } from "react";

import {
  Accordion,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  MultiSelect,
  ScrollArea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import SettingList from "~/lists/SettingList";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { DateInput } from "@mantine/dates";
import CompanyList from "~/lists/CompanyList";
import type { CreditNote } from "@prisma/client";
import LineOrders from "./utils/LineOrders";

const InvoiceForm = () => {
  const { invoice, creditNotes, currencies, vatRates, clients } =
    useLoaderData();

  const form = useForm({
    initialValues: {
      number: invoice?.number || "",
      date: invoice?.date || "",
      currency: invoice?.currency || "",
      vatRate: invoice?.vatRate || 0,
      creditNotes: invoice?.creditNotes || [],
      clientId: invoice?.clientId || null,
    },
  });
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Box p={"sm"}>
      {/*TODO make responsive containers*/}
      <Form method="POST" reloadDocument>
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <Flex direction={"row"} justify={"space-between"} align={"start"}>
            <div style={{ paddingRight: "24px", width: "100%" }}>
              <TextInput
                label="Number"
                name="number"
                // required
                ref={ref}
                {...form.getInputProps("number")}
              />
              <DateInput
                label="Invoice date"
                name="date"
                // withAsterisk
                {...form.getInputProps("date")}
              />

              <CompanyList
                type="client"
                companies={clients}
                {...form.getInputProps("clientId")}
              />
              <MultiSelect
                clearable
                searchable
                data={
                  creditNotes
                    ? creditNotes.map((cn: CreditNote) => {
                        return {
                          label: cn.number,
                          value: cn.id,
                        };
                      })
                    : []
                }
                label="Credit Notes"
                {...form.getInputProps("creditNotes")}
              />
              <SettingList
                setting={currencies}
                label="Currency"
                {...form.getInputProps("currency")}
                // required
              />
              <SettingList
                setting={vatRates}
                label="Vat rate"
                {...form.getInputProps("vatRate")}
                // required
              />
            </div>
            <Accordion style={{ width: "100%" }}>
              <Accordion.Item value="expData">
                <Accordion.Control>Expedition Info</Accordion.Control>
                <Accordion.Panel>
                  <TextInput
                    label="Buyer"
                    name="expName"
                    {...form.getInputProps("expName")}
                  />
                  <TextInput
                    label="Identification"
                    name="expId"
                    {...form.getInputProps("expId")}
                  />
                  <TextInput
                    label="Transport"
                    name="expVeh"
                    {...form.getInputProps("expVeh")}
                  />
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="orders">
                <Accordion.Control>Orders</Accordion.Control>
                <Accordion.Panel>
                  <LineOrders orders={[]} />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Flex>
        </ScrollArea.Autosize>
        <Divider size={"sm"} mt="xl" mb="xl" />
        <Group justify="center" gap={"sm"}>
          <Button onClick={() => console.log(form.values)}>Submit</Button>
          <Button type="reset" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Group>
      </Form>
    </Box>
  );
};

export default InvoiceForm;
