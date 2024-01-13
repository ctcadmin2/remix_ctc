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
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import SettingList from "~/lists/SettingList";
import VehiclesList from "~/lists/VehicleList";

const CreditNoteForm = () => {
  const { creditNote, currencies } = useLoaderData();
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
        {...(form.values.files ? { encType: "multipart/form-data" } : {})}
      >
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <div style={{ paddingRight: "24px" }}>
            <TextInput
              label="Number"
              name="number"
              required
              ref={ref}
              {...form.getInputProps("number")}
            />
            <VehiclesList {...form.getInputProps("vehicleId")} />
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
