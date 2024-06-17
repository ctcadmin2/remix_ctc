import { Button, Group, Modal } from "@mantine/core";
import type { Dispatch, JSX, SetStateAction } from "react";

interface Props {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  form: JSX.Element;
}

const DetailsModal = ({ opened, setOpened, form }: Props) => {
  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(!opened)}
      title="Company info"
      centered
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      radius={"md"}
      size={"xl"}
    >
      {form}
      <Group mt={"xl"} justify="center">
        <Button variant="outline" onClick={() => setOpened(false)}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );
};

export default DetailsModal;
