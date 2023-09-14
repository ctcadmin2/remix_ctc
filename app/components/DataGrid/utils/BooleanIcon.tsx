import { ThemeIcon } from "@mantine/core";
import { Check, X } from "react-feather";

const BooleanIcon = ({ value }: { value: boolean }) => {
  return value ? (
    <ThemeIcon variant="outline" radius="xl" size="sm" color="green">
      <Check />
    </ThemeIcon>
  ) : (
    <ThemeIcon variant="outline" radius="xl" size="sm" color="red">
      <X />
    </ThemeIcon>
  );
};
export default BooleanIcon;
