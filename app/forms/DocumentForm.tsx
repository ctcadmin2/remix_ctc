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
import { useFocusTrap } from "@mantine/hooks";
import type { Document } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { Upload } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

interface Props {
  document?: Document | null;
}

const DocumentForm = ({ document = null }: Props): JSX.Element => {
  const form = useForm({
    initialValues: {
      description: document?.description || "",
      expire: document?.expire ? new Date(document.expire) : undefined,
      comment: document?.comment || "",
      files: [],
    },
  });
  const focusTrapRef = useFocusTrap(true);
  const navigate = useNavigate();

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
          ref={focusTrapRef}
          required
          {...form.getInputProps("description")}
        />
        <DateInput
          label="Expire"
          name="expire"
          clearable
          highlightToday
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
