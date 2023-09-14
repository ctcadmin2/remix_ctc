import { useEffect, useRef } from "react";

import {
  Box,
  Button,
  Divider,
  FileInput,
  Group,
  NumberInput,
  ScrollArea,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import VehiclesList from "~/lists/VehicleList";
import SettingList from "~/lists/SettingList";
import { Form, useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils";
import { Upload } from "react-feather";

const CreditNoteForm = () => {
  const submit = useSubmit();
  const { creditNote, currencies } = useLoaderData();
  const form = useForm({
    initialValues: {
      number: creditNote?.number || "",
      amount: creditNote?.amount || "",
      currency: creditNote?.currency || "",
      paid: creditNote?.paid || false,
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

  const handleSubmit = (
    _v: any,
    e: { currentTarget: HTMLFormElement | undefined }
  ) => {
    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "post",
      ...(form.values.files ? { encType: "multipart/form-data" } : {}),
    });
  };

  return (
    <Box p={"sm"}>
      {/*TODO make responsive containers*/}
      <Form
        // reloadDocument
        onSubmit={form.onSubmit(handleSubmit)}
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
            <Switch
              labelPosition="left"
              label="Paid"
              name="paid"
              size="md"
              my={16}
              {...form.getInputProps("paid", { type: "checkbox" })}
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
              icon={<Upload strokeWidth={"3px"} size={"16px"} />}
            />
          </div>
        </ScrollArea.Autosize>
        <Divider size={"sm"} mt="xl" mb="xl" />
        <Group position="center" spacing={"sm"}>
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
