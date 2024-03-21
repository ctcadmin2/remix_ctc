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
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import SettingList from "~/lists/SettingList";
import { loader as editLoader } from "~/routes/vehicles.$vehicleId.edit";
import { loader as newLoader } from "~/routes/vehicles.new";

const VehicleForm = () => {
  const { vehicle, categories } = useLoaderData<
    typeof newLoader | typeof editLoader
  >();
  const form = useForm({
    initialValues: {
      registration: vehicle?.registration || "",
      vin: vehicle?.vin || "",
      category: vehicle?.category || "",
      active: vehicle?.active || false,
      nickname: vehicle?.nickname || "",
    },
  });
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <Box p={"sm"}>
      {/*TODO make responsive containers*/}
      <Form method="post" reloadDocument>
        <AuthenticityTokenInput />
        <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
          <div style={{ paddingRight: "24px" }}>
            <TextInput
              label="Registration"
              name="registration"
              required
              ref={ref}
              {...form.getInputProps("registration")}
            />
            <TextInput
              label="VIN"
              name="vin"
              required
              ref={ref}
              {...form.getInputProps("vin")}
            />
            <SettingList
              label="Category"
              setting={categories}
              {...form.getInputProps("category")}
              required={false}
            />
            <Switch
              labelPosition="left"
              label="Active"
              name="active"
              size="md"
              my={16}
              {...form.getInputProps("active", { type: "checkbox" })}
            />
            <TextInput
              label="Nickname"
              name="nickname"
              ref={ref}
              {...form.getInputProps("nickname")}
            />
          </div>
        </ScrollArea.Autosize>
        <Divider size={"sm"} mt="xl" mb="xl" />
        <Group justify="center" gap={"sm"}>
          <Button type="submit">Submit</Button>
          <Button type="reset" onClick={() => navigate(-1)}>
            Back
          </Button>
        </Group>
      </Form>
    </Box>
  );
};

export default VehicleForm;
