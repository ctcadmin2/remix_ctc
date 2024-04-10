import {
  Box,
  Button,
  Divider,
  Flex,
  Group,
  ScrollArea,
  Select,
  Switch,
  TextInput,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { Company } from "@prisma/client";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Search } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import { CountrySelect } from "~/utils/countryCodes";

interface Props {
  data?: Company | undefined;
  readOnly?: boolean;
}

const CompanyForm = ({
  data = undefined,
  readOnly = false,
}: Props): JSX.Element => {
  const { values, initialize, getInputProps, reset } = useForm<
    Partial<Company>
  >({
    initialValues: {
      name: data?.name || "",
      registration: data?.registration || "",
      vatNumber: data?.vatNumber || "",
      vatValid: data?.vatValid || false,
      accRon: data?.accRon || "",
      accEur: data?.accEur || "",
      address: data?.address || "",
      country: data?.country || "",
      bank: data?.bank || "",
      capital: data?.capital || "",
      email: data?.email || "",
      phone: data?.phone || "",
    },
  });

  const [manual, setManual] = useState(data ?? false);
  const focusTrapRef = useFocusTrap(true);
  const navigate = useNavigate();
  const fetcher = useFetcher({ key: "findCompany" });

  useEffect(() => {
    if (data) {
      initialize(data);
      setManual(true);
      return;
    }
    if (fetcher.data != null) {
      initialize(fetcher.data);
      setManual(true);
      return;
    }
  }, [data, fetcher.data, initialize]);

  return (
    <Box p={"sm"}>
      {!manual ? (
        <fetcher.Form method="post">
          <AuthenticityTokenInput />
          <Flex align={"center"} justify={"center"} columnGap={"lg"}>
            <Select
              disabled={fetcher.state === "loading"}
              placeholder="Select country"
              required
              searchable
              clearable
              name="country"
              ref={focusTrapRef}
              data={CountrySelect()}
              {...getInputProps("country")}
            />
            <TextInput
              placeholder="VAT Number"
              required
              disabled={fetcher.state === "loading"}
              name="vatNumber"
              {...getInputProps("vatNumber")}
            />
            <Button.Group>
              <Button
                loading={fetcher.state === "loading"}
                disabled={values.country === "" || values.vatNumber === ""}
                leftSection={<Search />}
                type="submit"
                name="_action"
                value="search"
                styles={{ root: { marginBottom: rem(4) } }}
                color="teal"
              >
                Find
              </Button>
              <Divider
                color="white"
                orientation="vertical"
                size={"md"}
                styles={{ root: { marginBottom: rem(4) } }}
              />
              <Button
                styles={{ root: { marginBottom: rem(4) } }}
                color="teal"
                onClick={() => setManual(true)}
              >
                Manual input
              </Button>
            </Button.Group>
          </Flex>
        </fetcher.Form>
      ) : null}

      <Form method="post" reloadDocument aria-readonly>
        <AuthenticityTokenInput />
        {manual ? (
          <ScrollArea.Autosize mah={"60vh"} offsetScrollbars>
            <div style={{ paddingRight: "24px" }}>
              <TextInput
                label="Name"
                name="name"
                required
                ref={focusTrapRef}
                readOnly={readOnly}
                {...getInputProps("name")}
              />
              <TextInput
                label="VAT number"
                name="vatNumber"
                required
                readOnly={readOnly}
                {...getInputProps("vatNumber")}
              />
              <Switch
                labelPosition="left"
                label="Vies valid"
                name="vatValid"
                readOnly={readOnly}
                size="md"
                my={16}
                {...getInputProps("vatValid", { type: "checkbox" })}
              />
              <TextInput
                label="Registration"
                name="registration"
                readOnly={readOnly}
                {...getInputProps("registration")}
              />
              <Select
                label="Country"
                placeholder="Select country"
                name="country"
                readOnly={readOnly}
                required
                withAsterisk
                data={CountrySelect()}
                {...getInputProps("country")}
              />
              <TextInput
                label="Address"
                name="address"
                readOnly={readOnly}
                {...getInputProps("address")}
              />
              <TextInput
                label="RON Account"
                name="accountRon"
                readOnly={readOnly}
                {...getInputProps("accountRon")}
              />
              <TextInput
                label="EUR Account"
                name="accountEur"
                readOnly={readOnly}
                {...getInputProps("accountEur")}
              />
              <TextInput label="Bank" name="bank" {...getInputProps("bank")} />
              <TextInput
                label="Capital"
                name="capital"
                readOnly={readOnly}
                {...getInputProps("capital")}
              />
              <TextInput
                label="Phone"
                name="phone"
                readOnly={readOnly}
                {...getInputProps("phone")}
              />
              <TextInput
                label="Email"
                name="email"
                readOnly={readOnly}
                autoComplete=""
                {...getInputProps("email")}
              />
              <TextInput
                label="Contact"
                name="contact"
                readOnly={readOnly}
                {...getInputProps("contact")}
              />
            </div>
          </ScrollArea.Autosize>
        ) : null}
        <Divider size={"sm"} mt="xl" mb="xl" />
        {!readOnly ? (
          <Group justify="center" gap={"sm"}>
            {manual ? (
              <>
                <Button type="submit" name="_action" value="create">
                  Submit
                </Button>
                <Button
                  type="reset"
                  leftSection={<Search />}
                  onClick={() => {
                    setManual(false);
                    reset();
                  }}
                >
                  Search again
                </Button>
              </>
            ) : null}
            <Button color="red" type="reset" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Group>
        ) : null}
      </Form>
    </Box>
  );
};
export default CompanyForm;
