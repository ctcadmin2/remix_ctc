import {
  Button,
  Divider,
  FileInput,
  Group,
  ScrollArea,
  TextInput,
  Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Document } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

interface Props {
  document?: Document | null;
}

const DocumentForm = ({ document = null }: Props): JSX.Element => {
  const form = useForm({
    initialValues: {
      description: document?.description || "",
      expire: document?.expire ? new Date(document.expire) : new Date(),
      comment: document?.comment || "",
      files: [],
    },
  });
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Form
      method="post"
      reloadDocument
      encType={
        form.values.files[0]
          ? "multipart/form-data"
          : "application/x-www-form-urlencoded"
      }
    >
      <AuthenticityTokenInput />
      <ScrollArea.Autosize mih={"70vh"} offsetScrollbars>
        <TextInput
          label="Description"
          name="description"
          required
          {...form.getInputProps("description")}
        />
        <DateInput
          label="Expire"
          name="expire"
          clearable
          placeholder="Date input"
          popoverProps={{ withinPortal: true }}
          {...form.getInputProps("expire")}
        />
        <Textarea
          label="Comment"
          name="comment"
          {...form.getInputProps("comment")}
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

export default DocumentForm;
