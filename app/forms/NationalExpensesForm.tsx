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
import { DatePickerInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import type { NationalExpense } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { Calendar, Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import CompanyList, { type CompaniesListType } from "~/lists/CompanyList";
import SettingList from "~/lists/SettingList";

interface Props {
  expense?: NationalExpense | null;
  descriptions: string[];
  suppliers: CompaniesListType[];
  paymentOptions: string[];
}

const NationalExpenseForm = ({
  expense = null,
  descriptions,
  suppliers,
  paymentOptions,
}: Props): JSX.Element => {
  const { getInputProps, values } = useForm({
    initialValues: {
      number: expense?.number || "",
      date: dayjs(expense?.date) || Date.now(),
      amount: expense?.amount || "",
      description: expense?.description || "",
      paidBy: expense?.paidBy || "",
      supplierId: expense?.supplierId || "",
      files: [],
    },
  });
  const focusTrapRef = useFocusTrap(true);
  const navigate = useNavigate();

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
              ref={focusTrapRef}
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
              setting={descriptions}
              label="Description"
              {...getInputProps("description")}
              required
            />
            <SettingList
              setting={paymentOptions}
              label="Paid by"
              {...getInputProps("paidBy")}
              required={false}
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

export default NationalExpenseForm;
