import { useEffect, useRef } from "react";

import {
  Button,
  Divider,
  FileInput,
  Group,
  ScrollArea,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";
import { DateInput } from "@mantine/dates";
import { Upload } from "react-feather";

const DocumentForm = () => {
  const { document } = useLoaderData();

  const form = useForm({
    initialValues: {
      description: document?.description || "",
      expire: document?.expire ? new Date(document.expire) : null,
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
          icon={<Upload strokeWidth={"3px"} size={"16px"} />}
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

export default DocumentForm;
