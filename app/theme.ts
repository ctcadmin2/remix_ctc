import {
  createTheme,
  Input,
  InputWrapper,
  type MantineThemeOverride,
  Select,
  MultiSelect,
  PillsInput,
  Switch,
  Tabs,
  PillsInputField,
} from "@mantine/core";
import InputWrapperCSS from "~/css/InputWrapper.module.css";
import InputCSS from "~/css/Input.module.css";
import MultiSelectCSS from "~/css/MultiSelect.module.css";
import PillsInputCSS from "~/css/PillsInput.module.css";
import PillsInputFieldCSS from "~/css/PillsInputField.module.css";
import SwitchCSS from "~/css/Switch.module.css";
import SelectCSS from "~/css/Select.module.css";
import TabsCSS from "~/css/Tabs.module.css";
export const theme: MantineThemeOverride = createTheme({
  components: {
    Input: Input.extend({
      classNames: {
        wrapper: InputCSS.wrapper,
      },
    }),
    InputWrapper: InputWrapper.extend({
      classNames: {
        root: InputWrapperCSS.root,
        label: InputWrapperCSS.label,
        error: InputWrapperCSS.error,
      },
    }),
    MultiSelect: MultiSelect.extend({
      classNames: {
        root: MultiSelectCSS.root,
      },
    }),
    PillsInput: PillsInput.extend({
      classNames: {
        input: PillsInputCSS.input,
      },
    }),
    PillsInputField: PillsInputField.extend({
      classNames: {
        field: PillsInputFieldCSS.field,
      },
    }),
    Select: Select.extend({
      classNames: {
        root: SelectCSS.root,
      },
    }),
    Switch: Switch.extend({
      classNames: {
        labelWrapper: SwitchCSS.labelWrapper,
      },
    }),
    Tabs: Tabs.extend({
      classNames: {
        list: TabsCSS.list,
        panel: TabsCSS.panel,
      },
    }),
  },
});
