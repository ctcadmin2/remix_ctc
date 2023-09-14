import { ActionIcon, Badge, Input, TextInput } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { Save, X } from "react-feather";

const Multi = ({ name, value }: { name: string; value: string[] }) => {
  const [inputValue, setInputValue] = useState("");
  const [values, handlers] = useListState(value);
  let submit = useSubmit();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      submit({ name, value: JSON.stringify(values) }, { method: "post" });
    }
    didMountRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleAdd = () => {
    handlers.append(inputValue);
    setInputValue("");
  };

  const removeButton = (i: number) => {
    return (
      <ActionIcon
        size="xs"
        color="red"
        radius="xl"
        variant="transparent"
        onClick={() => handlers.remove(i)}
      >
        <X />
      </ActionIcon>
    );
  };

  const saveButton = (
    <ActionIcon
      radius={"lg"}
      size="sm"
      color="green"
      disabled={inputValue.length === 0}
      onClick={() => handleAdd()}
    >
      <Save />
    </ActionIcon>
  );

  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
      }}
    >
      <Input.Wrapper
        label={name}
        py={"sm"}
        sx={{ flexDirection: "column", flexFlow: "row nowrap" }}
      >
        {value.map((v, i) => (
          <Badge
            key={i}
            color="blue"
            variant="outline"
            radius={"lg"}
            mr={"md"}
            my={"xs"}
            rightSection={removeButton(i)}
          >
            {v}
          </Badge>
        ))}
        <TextInput
          radius={"lg"}
          placeholder="Add new option..."
          rightSection={saveButton}
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
      </Input.Wrapper>
    </div>
  );
};

export default Multi;
