import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  NumberInput,
  ScrollArea,
  TextInput,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { Calendar, Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import CompanyList from "~/lists/CompanyList";
import SettingList from "~/lists/SettingList";
import { loader as editLoader } from "~/routes/internationalExpenses.$internationalExpenseId.edit";
import { loader as newLoader } from "~/routes/internationalExpenses.new";

const InternationalExpenseForm = () => {
  const { expense, descriptions, suppliers, currencies } = useLoaderData<
    typeof newLoader | typeof editLoader
  >();

  console.log(suppliers);

  const { getInputProps, values } = useForm({
    initialValues: {
      number: expense?.number || "",
      date: dayjs(expense?.date) || Date.now(),
      amount: expense?.amount || "",
      currency: expense?.currency || "",
      description: expense?.description || "",
      supplierId: expense?.supplierId || "",
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
            <TextInput
              label="Number"
              name="number"
              required
              ref={ref}
              {...getInputProps("number")}
            />
            <MonthPickerInput
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
            />{" "}
            <SettingList
              setting={currencies}
              label="Currency"
              {...getInputProps("currency")}
              required
            />
            <SettingList
              setting={descriptions}
              label="Description"
              {...getInputProps("description")}
              required
            />
            <CompanyList
              type={"supplier"}
              companies={suppliers}
              required
              {...getInputProps("supplierId")}
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

export default InternationalExpenseForm;
