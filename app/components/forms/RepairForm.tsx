import {
  Button,
  Divider,
  Group,
  ScrollArea,
  TextInput,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type { Repair } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

interface Props {
  repair?: Repair | null;
}

const RepairForm = ({ repair = null }: Props): JSX.Element => {
  const form = useForm({
    initialValues: {
      date: new Date(repair?.date ?? Date.now()),
      km: repair?.km || "",
      comment: repair?.comment || "",
    },
  });
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref) {
      ref.current?.select();
    }
  }, []);

  return (
    <Form method="post" reloadDocument>
      <AuthenticityTokenInput />
      <ScrollArea.Autosize mih={"70vh"} offsetScrollbars>
        <TextInput
          label="Km"
          name="km"
          ref={ref}
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
          py={"0.25rem"}
        />
        <Textarea
          label="Comment"
          name="comment"
          required
          {...form.getInputProps("comment")}
        />
      </ScrollArea.Autosize>
      <Divider size={"sm"} mt="xl" mb="xl" />
      <Group justify="center" gap={"sm"}>
        <Button type="submit">Submit</Button>
        <Button type="reset" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Group>
    </Form>
  );
};

export default RepairForm;
