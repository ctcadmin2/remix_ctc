import { Alert, Button, Group, Modal } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useSubmit } from "@remix-run/react";
import { AlertCircle } from "react-feather";
import { useAuthenticityToken } from "remix-utils";

type Document = { id: number };

type Props<T extends Document> = {
  name: string;
  title: string | undefined;
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  document: T | undefined;
};
function DeleteModal<T extends Document>({
  name,
  title,
  opened,
  setOpened,
  document,
}: Props<T>) {
  let csrf = useAuthenticityToken();
  const submit = useSubmit();

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(!opened)}
      title={`Deleting ${title}.`}
      centered
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      radius={"md"}
    >
      <Alert
        variant="outline"
        icon={<AlertCircle size="1rem" />}
        title="Warning!"
        color="red"
      >
        {`You are going to delete a ${name}. This action will delete all other
        associated data. Please confirm.`}
      </Alert>
      <Group mt={"xl"} position="center">
        <Button
          variant="filled"
          color="red"
          onClick={() => {
            if (document) {
              submit({ csrf, id: document.id }, { method: "DELETE" });
            } else {
              notifications.show({
                title: "Error!",
                message: "No vehicle found.",
              });
            }
            setOpened(false);
          }}
        >
          Delete
        </Button>
        <Button variant="outline" onClick={() => setOpened(false)}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
}

export default DeleteModal;
