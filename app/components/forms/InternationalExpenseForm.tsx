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
import { useFocusTrap } from "@mantine/hooks";
import type { InternationalExpense } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { Calendar, Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import CompanyList, {
  type CompaniesListType,
} from "~/components/lists/CompanyList";
import SettingList from "~/components/lists/SettingList";

interface Props {
  expense?: InternationalExpense | null;
  descriptions: string[];
  suppliers: CompaniesListType[];
  currencies: string[];
}

const InternationalExpenseForm = ({
  expense = null,
  descriptions,
  suppliers,
  currencies,
}: Props): JSX.Element => {
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
