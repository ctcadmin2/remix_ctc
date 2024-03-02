import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  NumberInput,
  ScrollArea,
  Switch,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { Calendar, Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import SettingList from "~/lists/SettingList";
import { loader as editLoader } from "~/routes/nationalExpenses.$nationalExpenseId.edit";
import { loader as newLoader } from "~/routes/nationalExpenses.new";

const TripExpenseForm = () => {
  const { expense, descriptions, currencies } = useLoaderData<
    typeof newLoader | typeof editLoader
  >();

  const { getInputProps, values } = useForm({
    initialValues: {
      intNr: expense?.intNr || 0,
      number: expense?.number || "",
      date: dayjs(expense?.date) || Date.now(),
      amount: expense?.amount || "",
      currency: expense?.currency || true,
      amountEur: expense?.amountEur || "",
      description: expense?.description || "",
      card: expense?.card || true,
      files: [],
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
      <Form
        reloadDocument
        method="POST"
        {...(values.files ? { encType: "multipart/form-data" } : {})}
      >
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <div style={{ paddingRight: "24px" }}>
            <NumberInput
              label="Internal number"
              name="intNr"
              required
              ref={ref}
              {...getInputProps("intNr")}
            />
            <TextInput
              label="Number"
              name="number"
              required
              ref={ref}
              {...getInputProps("number")}
            />
            <DatePickerInput
              name="date"
              label="Date"
              {...getInputProps("date", {
                withFocus: false,
              })}
              required
              leftSection={<Calendar />}
              pb={0}
            />
            <NumberInput
              label="Amount"
              name="amount"
              required
              hideControls
              {...getInputProps("amount")}
            />
            <SettingList
              setting={currencies}
              label="Currency"
              {...getInputProps("currency")}
              required
            />
            <NumberInput
              label="Eur amount"
              name="amountEur"
              required
              hideControls
              {...getInputProps("amountEur")}
            />
            <SettingList
              setting={descriptions}
              label="Description"
              {...getInputProps("description")}
              required
            />
            <Switch
              labelPosition="left"
              label="Card payment"
              name="card"
              size="md"
              my={16}
              {...getInputProps("card", { type: "checkbox" })}
            />
            <FileInput
              label="Add files"
              name="files"
              multiple
              clearable
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              {...getInputProps("files", { type: "input" })}
              leftSection={<Upload strokeWidth={"3px"} size={"16px"} />}
            />
          </div>
        </ScrollArea.Autosize>
        <Divider size={"sm"} mt="xl" mb="xl" />
        <Group justify="center" gap={"sm"}>
          <Button type="submit">Submit</Button>
          <Button type="reset" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Group>
      </Form>
    </Box>
  );
};

export default TripExpenseForm;
