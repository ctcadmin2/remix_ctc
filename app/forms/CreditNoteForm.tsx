import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  NumberInput,
  ScrollArea,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import type { CreditNote } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import SettingList from "~/lists/SettingList";
import VehiclesList, { type VehiclesListType } from "~/lists/VehicleList";

interface Props {
  creditNote?: CreditNote | undefined;
  currencies: string[];
  vehicles: VehiclesListType[] | null;
}

const CreditNoteForm = ({
  creditNote,
  currencies,
  vehicles,
}: Props): JSX.Element => {
  const form = useForm({
    initialValues: {
      number: creditNote?.number || "",
      amount: creditNote?.amount || "",
      currency: creditNote?.currency || "",
      start: creditNote?.start || "",
      end: creditNote?.end || "",
      week: creditNote?.week || "",
      notes: creditNote?.notes || "",
      vehicleId: creditNote?.vehicleId || "",
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
        {...(form.values.files ? { encType: "multipart/form-data" } : {})}
      >
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <div style={{ paddingRight: "24px" }}>
            <TextInput
              label="Number"
              name="number"
              required
              ref={focusTrapRef}
              {...form.getInputProps("number")}
            />
            <VehiclesList
              vehicles={vehicles}
              {...form.getInputProps("vehicleId")}
            />
            <NumberInput
              label="Amount"
              name="amount"
              required
              hideControls
              {...form.getInputProps("amount")}
            />
            <SettingList
              setting={currencies}
              label="Currency"
              {...form.getInputProps("currency")}
              required
            />
            <TextInput
              label="Start"
              name="start"
              {...form.getInputProps("start")}
            />
            <TextInput label="End" name="end" {...form.getInputProps("end")} />
            <NumberInput
              label="Week"
              name="week"
              hideControls
              {...form.getInputProps("week")}
            />
            <Textarea
              label="Notes"
              name="notes"
              {...form.getInputProps("notes")}
            />
            <FileInput
              label="Add files"
              name="files"
              multiple
              clearable
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              {...form.getInputProps("files", { type: "input" })}
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

export default CreditNoteForm;
