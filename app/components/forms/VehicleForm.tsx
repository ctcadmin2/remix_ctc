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
import type { Vehicle } from "@prisma/client";
import { Form, useNavigate } from "@remix-run/react";
import { useEffect, useRef } from "react";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import SettingList from "~/components/lists/SettingList";

interface Props {
  vehicle?: Vehicle | null;
  categories: string[];
}

const VehicleForm = ({ vehicle, categories }: Props): JSX.Element => {
  const form = useForm({
    initialValues: {
      registration: vehicle?.registration || "",
      vin: vehicle?.vin || "",
      category: vehicle?.category || "",
      active: vehicle?.active || false,
      nickname: vehicle?.nickname || "",
    },
  });
  const navigate = useNavigate();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref) {
      ref.current?.select();
    }
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
              py={"0.25rem"}
              {...form.getInputProps("active", { type: "checkbox" })}
            />
            <TextInput
              label="Nickname"
              name="nickname"
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
