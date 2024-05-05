import {
  ActionIcon,
  Checkbox,
  NumberInput,
  ScrollArea,
  Table,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useEffect, useRef } from "react";
import { Calendar, X } from "react-feather";

import { usePaymentFormContext } from "./utils/FormContext/PaymentFormContext";

const IndemnizationForm = () => {
  const { values, getInputProps, removeListItem } = usePaymentFormContext();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [values.indemnizations.length]);

  return (
    <ScrollArea.Autosize mah={"50vh"} offsetScrollbars mt={"3rem"}>
      <Table verticalSpacing={"xs"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Period</Table.Th>
            <Table.Th style={{ textAlign: "center" }}>Per day</Table.Th>
            <Table.Th style={{ textAlign: "center" }}>Avans</Table.Th>
            <Table.Th style={{ textAlign: "center" }}>Delegation</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {values.indemnizations.map((_indemnization, i) => {
            return (
              <Table.Tr key={i}>
                <Table.Td>
                  <DatePickerInput
                    type="range"
                    allowSingleDateInRange
                    name={`indemnizations[${i}].period`}
                    {...getInputProps(`indemnizations.${i}.period`, {
                      withFocus: false,
                    })}
                    required
                    leftSection={<Calendar />}
                    pb={0}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    name={`indemnizations[${i}].perDay`}
                    ref={ref}
                    {...getInputProps(`indemnizations.${i}.perDay`, {
                      withFocus: false,
                    })}
                    pb={0}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    name={`indemnizations[${i}].avans`}
                    {...getInputProps(`indemnizations.${i}.avans`, {
                      withFocus: false,
                    })}
                    pb={0}
                  />
                </Table.Td>
                <Table.Td>
                  <Checkbox
                    name={`indemnizations[${i}].delegation`}
                    {...getInputProps(`indemnizations.${i}.delegation`, {
                      type: "checkbox",
                    })}
                    styles={{ body: { justifyContent: "center" } }}
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
                    onClick={() => removeListItem("indemnizations", i)}
                  >
                    <X />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </ScrollArea.Autosize>
  );
};

export default IndemnizationForm;
