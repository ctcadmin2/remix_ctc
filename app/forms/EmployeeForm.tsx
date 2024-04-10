import {
  Box,
  Button,
  Divider,
  Group,
  ScrollArea,
  Switch,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { Employee } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

interface Props {
  employee?: Employee | null;
}

const EmployeeForm = ({ employee = null }: Props): JSX.Element => {
  const { getInputProps } = useForm<Partial<Employee> | null>({
    initialValues: {
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      active: employee?.active || false,
      ssn: employee?.ssn || "",
    },
  });
  const focusTrapRef = useFocusTrap(true);
  const navigate = useNavigate();

  return (
    <Box p={"sm"}>
      <Form method="post" reloadDocument aria-readonly>
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <div style={{ paddingRight: "24px" }}>
            <TextInput
              label="First name"
              name="firstName"
              required
              ref={focusTrapRef}
              {...getInputProps("firstName")}
            />
            <TextInput
              label="Last name"
              name="lastName"
              required
              {...getInputProps("lastName")}
            />
            <Switch
              labelPosition="left"
              label="Active"
              name="active"
              size="md"
              my={16}
              {...getInputProps("active", { type: "checkbox" })}
            />
            <TextInput label="SSN" name="ssn" {...getInputProps("ssn")} />
          </div>
        </ScrollArea.Autosize>
        <Divider size={"sm"} mt="xl" mb="xl" />
        <Group justify="center" gap={"sm"}>
          <Button type="submit" name="_action" value="create">
            Submit
          </Button>

          <Button color="red" type="reset" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Group>
      </Form>
    </Box>
  );
};
export default EmployeeForm;
