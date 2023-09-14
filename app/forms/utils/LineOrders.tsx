import { ActionIcon, Flex, TextInput } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import type { Order } from "@prisma/client";

type Props = {
  orders: Order[];
};

const LineOrders = ({ orders }: Props) => {
  const [values, handlers] = useListState(orders);

  return (
    <Flex>
      {values.map((order) => {
        return (
          <>
            <TextInput />
            <TextInput />
            <TextInput />
            <TextInput />
            <ActionIcon />
          </>
        );
      })}
    </Flex>
  );
};

export default LineOrders;
