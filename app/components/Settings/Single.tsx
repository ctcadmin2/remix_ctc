import { ActionIcon, TextInput } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import { Edit, Save } from "react-feather";

const Single = ({ name, value }: { name: string; value: string }) => {
  const [textValue, setTextValue] = useState(value);
  const [isEdit, toggleEdit] = useToggle([false, true]);
  const ref = useRef<HTMLInputElement>(null);
  const submit = useSubmit();

  const handleEdit = () => {
    toggleEdit();
    !isEdit && ref.current?.select();
    if (isEdit) {
      submit({ name, value: JSON.stringify([textValue]) }, { method: "POST" });
    }
  };

  const saveButton = (
    <ActionIcon
      variant="subtle"
      component={"a"}
      size="sm"
      color="green"
      onClick={handleEdit}
    >
      <Save />
    </ActionIcon>
  );

  const editButton = (
    <ActionIcon
      variant="subtle"
      component={"a"}
      size="sm"
      color="yellow"
      onClick={handleEdit}
    >
      <Edit />
    </ActionIcon>
  );

  return (
    <TextInput
      py={"sm"}
      ref={ref}
      label={name}
      readOnly={!isEdit}
      value={textValue}
      onChange={(event) => setTextValue(event.currentTarget.value)}
      rightSection={isEdit ? saveButton : editButton}
    />
  );
};

export default Single;
