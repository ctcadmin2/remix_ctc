import { Select } from "@mantine/core";
import type { Setting } from "@prisma/client";
import { camalize } from "~/utils/stringUtils";

type Props = {
  setting: Setting;
  label: string;
  value: string | null | undefined;
  onChange: ((value: string | null) => void) | undefined;
  required: boolean;
};

const SettingList = ({ setting, label, value, onChange, required }: Props) => {
  //   const updateValue = (value: string) => {
  //     updateSetting({
  //       variables: {
  //         id: setting.id,
  //         input: { value: [...setting.value, value] },
  //       },
  //       onCompleted: () => {
  //         showNotification({
  //           title: "Settings",
  //           message: "Option was added successfully.",
  //         });
  //       },
  //     });
  //   };

  return (
    <Select
      label={label}
      name={camalize(label)}
      placeholder="Pick one"
      required={required}
      allowDeselect
      //   creatable
      clearable
      searchable
      //   getCreateLabel={(query) => `+ Create ${query}`}
      //   onCreate={(query) => {
      //     updateValue(query);
      //     return query;
      //   }}
      data={setting.value}
      value={value}
      onChange={onChange}
    />
  );
};

export default SettingList;
