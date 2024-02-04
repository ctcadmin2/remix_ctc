import { Modal, Group, Button } from "@mantine/core";

interface Props {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
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
