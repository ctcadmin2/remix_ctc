import type { SelectStylesNames } from "@mantine/core";
import { Select } from "@mantine/core";

import { camalize } from "~/utils/stringUtils";

interface Props {
  setting: string[];
  label: string;
  value?: string | null;
  onChange: ((value: string | null) => void) | undefined;
  required: boolean;
  styles?: Partial<Record<SelectStylesNames, React.CSSProperties>>;
}

const SettingList = ({
  setting,
  label,
  value,
  onChange,
  required,
  styles,
}: Props) => {
  return (
    //TODO add creatable setting
    <Select
      label={label}
      name={camalize(label)}
      placeholder="Pick one"
      required={required}
      allowDeselect
      clearable
      searchable
      data={setting}
      value={value}
      onChange={onChange}
      styles={styles}
    />
  );
};

export default SettingList;
