import { ActionIcon, Box, TextInput } from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { useSubmit } from "@remix-run/react";
import { useRef, useState } from "react";
import { Edit, Save } from "react-feather";

const Single = ({ name, value }: { name: string; value: string }) => {
  const [textValue, setTextValue] = useState(value);
  const [isEdit, toggleEdit] = useToggle([false, true]);
  const ref = useRef<HTMLInputElement>(null);
  let submit = useSubmit();

  const handleEdit = () => {
    toggleEdit();
    !isEdit && ref.current?.select();
    if (isEdit) {
      submit({ name, value: JSON.stringify([textValue]) }, { method: "POST" });
    }
  };

  const saveButton = (
    <ActionIcon component={"a"} size="sm" color="green" onClick={handleEdit}>
      <Save />
    </ActionIcon>
  );

  const editButton = (
    <ActionIcon component={"a"} size="sm" color="yellow" onClick={handleEdit}>
      <Edit />
    </ActionIcon>
  );

  return (
    <Box
      style={{
        textAlign: "center",
        paddingTop: "var(--mantine-spacing-sm)",
        paddingBottom: "var(--mantine-spacing-sm)",
      }}
    >
      <TextInput
        ref={ref}
        label={name}
        readOnly={!isEdit}
        value={textValue}
        onChange={(event) => setTextValue(event.currentTarget.value)}
        rightSection={isEdit ? saveButton : editButton}
      />
    </Box>
  );
};

export default Single;
