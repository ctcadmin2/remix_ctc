import { Text } from "@mantine/core";

const EFacturaStatus = ({
  status,
}: {
  status: string | undefined;
}): JSX.Element => {
  return <Text size="xs">{status ?? "not proc"}</Text>;
};

export default EFacturaStatus;
