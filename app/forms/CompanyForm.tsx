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
import { Company } from "@prisma/client";
import { Form, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { useRef, useEffect, useState } from "react";
import { Search } from "react-feather";
import { AuthenticityTokenInput } from "remix-utils/csrf/react";

import { CountrySelect } from "~/utils/countryCodes";
const CompanyForm = ({ data = undefined }: { data?: Company | undefined }) => {
  const company = useLoaderData<Company | null>();

  const { values, setValues, getInputProps, reset } = useForm({
    initialValues: {
      name: company?.name || "",
      registration: company?.registration || "",
      vatNumber: company?.vatNumber || "",
      vatValid: company?.vatValid || false,
      accRon: company?.accRon || "",
      accEur: company?.accEur || "",
      address: company?.address || "",
      country: company?.country || "",
      bank: company?.bank || "",
      capital: company?.capital || "",
      email: company?.email || "",
      phone: company?.phone || "",
    },
  });

  const [manual, setManual] = useState(company ?? false);
  const ref = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const fetcher = useFetcher({ key: "findCompany" });

  useEffect(() => {
    if (data) {
      setValues(data);
      setManual(true);
      return;
    }
    if (fetcher.data != null) {
      setValues(fetcher.data);
      setManual(true);
      return;
    }
  }, [data, fetcher.data, setValues]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

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
              ref={ref}
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
                ref={ref}
                readOnly={data ? true : false}
                {...getInputProps("name")}
              />
              <TextInput
                label="VAT number"
                name="vatNumber"
                required
                readOnly={data ? true : false}
                {...getInputProps("vatNumber")}
              />
              <Switch
                labelPosition="left"
                label="Vies valid"
                name="vatValid"
                readOnly={data ? true : false}
                size="md"
                my={16}
                {...getInputProps("vatValid", { type: "checkbox" })}
              />
              <TextInput
                label="Registration"
                name="registration"
                readOnly={data ? true : false}
                {...getInputProps("registration")}
              />
              <Select
                label="Country"
                placeholder="Select country"
                name="country"
                readOnly={data ? true : false}
                required
                withAsterisk
                data={CountrySelect()}
                {...getInputProps("country")}
              />
              <TextInput
                label="Address"
                name="address"
                readOnly={data ? true : false}
                {...getInputProps("address")}
              />
              <TextInput
                label="RON Account"
                name="accountRon"
                readOnly={data ? true : false}
                {...getInputProps("accountRon")}
              />
              <TextInput
                label="EUR Account"
                name="accountEur"
                readOnly={data ? true : false}
                {...getInputProps("accountEur")}
              />
              <TextInput label="Bank" name="bank" {...getInputProps("bank")} />
              <TextInput
                label="Capital"
                name="capital"
                readOnly={data ? true : false}
                {...getInputProps("capital")}
              />
              <TextInput
                label="Phone"
                name="phone"
                readOnly={data ? true : false}
                {...getInputProps("phone")}
              />
              <TextInput
                label="Email"
                name="email"
                readOnly={data ? true : false}
                autoComplete=""
                {...getInputProps("email")}
              />
              <TextInput
                label="Contact"
                name="contact"
                readOnly={data ? true : false}
                {...getInputProps("contact")}
              />
            </div>
          </ScrollArea.Autosize>
        ) : null}
        <Divider size={"sm"} mt="xl" mb="xl" />
        {!data ? (
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
