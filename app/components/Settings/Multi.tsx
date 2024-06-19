import { Pill, PillsInput } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { useSubmit } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

const Multi = ({ name, value }: { name: string; value: string[] }) => {
  const [inputValue, setInputValue] = useState("");
  const [values, handlers] = useListState(value);
  const submit = useSubmit();
  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      submit({ name, value: JSON.stringify(values) }, { method: "post" });
    }
    didMountRef.current = true;
  }, [values]);

  const addSettings = (code: string) => {
    if (code === "Enter") {
      handlers.append(...inputValue.split(","));
      setInputValue("");
    }
  };

  console.log(values);
  const data = values.map((v, i) => (
    <Pill
      key={i}
      withRemoveButton
      onRemove={() => handlers.remove(i)}
      styles={{ root: { backgroundColor: "#A5F5DA" } }}
    >
      {v}
    </Pill>
  ));

  return (
    <PillsInput multiline label={name} py={"sm"}>
      <Pill.Group>{data}</Pill.Group>
      <PillsInput.Field
        placeholder="Add comma separated options..."
        onKeyDown={(e) => addSettings(e.code)}
        onChange={(e) => {
          setInputValue(e.currentTarget.value);
        }}
        value={inputValue}
      />
    </PillsInput>
  );
};

export default Multi;
