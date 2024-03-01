import {
  ActionIcon,
  Button,
  Flex,
  NumberInput,
  ScrollArea,
  Table,
  TextInput,
} from "@mantine/core";
import Decimal from "decimal.js";
import { X } from "react-feather";

import { useInvoiceFormContext } from "./FormContext/InvoiceFormContext";

interface Props {
  disabled: boolean;
}

const LineOrders = ({ disabled }: Props) => {
  const form = useInvoiceFormContext();

  return (
    <ScrollArea.Autosize mah={"50vh"} offsetScrollbars>
      <Flex direction={"column"} gap={"xs"} justify={"center"} align={"center"}>
        <Table verticalSpacing={"xs"}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Description</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Total</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {form.values.orders.map((order, i) => {
              return (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      name={`orders[${i}].description`}
                      {...form.getInputProps(`orders.${i}.description`)}
                      pb={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      name={`orders[${i}].quantity`}
                      {...form.getInputProps(`orders.${i}.quantity`)}
                      pb={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      name={`orders[${i}].amount`}
                      {...form.getInputProps(`orders.${i}.amount`)}
                      pb={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      name={`orders[${i}].total`}
                      value={new Decimal(order.amount)
                        .times(order.quantity)
                        .toString()}
                      onChange={(v) =>
                        form.setFieldValue(`orders.${i}.total`, v)
                      }
                      readOnly
                      pb={0}
                    />
                  </Table.Td>

                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      component={"a"}
                      size="sm"
                      color="red"
                      display={"flex"}
                      onClick={() => form.removeListItem("orders", i)}
                    >
                      <X />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
        <Button
          disabled={disabled}
          onClick={() =>
            form.insertListItem("orders", {
              description: "",
              quantity: 0,
              amount: "0",
              total: "0",
            })
          }
        >
          Add order...
        </Button>
      </Flex>
    </ScrollArea.Autosize>
  );
};

export default LineOrders;
