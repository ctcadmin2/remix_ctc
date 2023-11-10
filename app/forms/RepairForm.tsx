import { useEffect, useRef } from "react";

import {
  Button,
  Divider,
  Group,
  ScrollArea,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { DateInput } from "@mantine/dates";

const RepairForm = () => {
  const { repair } = useLoaderData();

  const form = useForm({
    initialValues: {
      date: repair ? new Date(repair.date) : new Date(),
      km: repair?.km || "",
      comment: repair?.comment || "",
    },
  });
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Form method="post" reloadDocument>
      <AuthenticityTokenInput />
      <ScrollArea.Autosize mih={"70vh"} offsetScrollbars>
        <TextInput
          label="Km"
          name="km"
          required
          {...form.getInputProps("km")}
        />
        <DateInput
          label="Date"
          name="date"
          required
          clearable
          placeholder="Date input"
          popoverProps={{ withinPortal: true }}
          {...form.getInputProps("date")}
        />
        <Textarea
          label="Comment"
          name="comment"
          required
          {...form.getInputProps("comment")}
        />
      </ScrollArea.Autosize>
      <Divider size={"sm"} mt="xl" mb="xl" />
      <Group position="center" spacing={"sm"}>
        <Button type="submit">Submit</Button>
        <Button type="reset" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Group>
    </Form>
  );
};

export default RepairForm;
