import {
  Button,
  Container,
  NativeSelect,
  Paper,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { type LoaderFunction, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
// import { badRequest } from "remix-utils/csrf/react";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { db } from "~/utils/db.server";
import {
  authenticator,
  createUserSession,
  register,
} from "~/utils/session.server";

const schema = zfd.formData({
  redirectTo: zfd.text(),
  firstName: zfd.text(),
  lastName: zfd.text(),
  email: zfd.text(),
  password: zfd.text(),
  passCheck: zfd.text(),
  language: zfd.text(z.union([z.literal("en"), z.literal("ro")])),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const data = schema.parse(await request.formData());

  const { passCheck, redirectTo, ...rest } = data;

  if (passCheck !== rest.password) {
    return badRequest({
      fieldErrors: { passCheck: `Password doesn't match.` },
      fields: { ...data },
    });
  }

  const emailExists = await db.user.findFirst({
    where: { email: rest.email },
  });
  if (emailExists) {
    return badRequest({
      fieldErrors: { email: `User with email ${rest.email} already exists` },
      fields: { ...data },
    });
  }
  // create the user
  // create their session and redirect to last route
  const user = await register({ ...rest });

  if (!user) {
    return badRequest({
      fieldErrors: {},
      fields: { ...data },
    });
  }

  return createUserSession(user.id, redirectTo);
};

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
};

const RegisterRoute = () => {
  const [searchParams] = useSearchParams();
  const data = useActionData();
  const { getInputProps, setErrors } = useForm({
    initialValues: {
      firstName: data?.fields?.firstName || "",
      lastName: data?.fields?.lastName || "",
      email: data?.fields?.email || "",
      password: data?.fields?.password || "",
      passCheck: data?.fields?.passCheck || "",
      language: data?.fields?.language || "en",
    },
  });

  useEffect(() => {
    if (data?.fieldErrors) {
      setErrors(data.fieldErrors);
    }
  }, [data, setErrors]);

  return (
    <Container size={600} my={60}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? "/"}
          />
          <TextInput
            name="firstName"
            label="First Name"
            required
            {...getInputProps("firstName")}
          />

          <TextInput
            name="lastName"
            label="Last Name"
            required
            {...getInputProps("lastName")}
            mt="md"
          />
          <TextInput
            name="email"
            label="Email"
            required
            {...getInputProps("email")}
            mt="md"
          />
          <NativeSelect
            name="language"
            label="Language"
            data={[
              { value: "ro", label: "Romana" },
              { value: "en", label: "English" },
            ]}
            {...getInputProps("language")}
            mt="md"
          />
          <PasswordInput
            name="password"
            label="Password"
            required
            {...getInputProps("password")}
            mt="md"
          />
          <PasswordInput
            name="passCheck"
            label="Confirm password"
            required
            {...getInputProps("passCheck")}
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl">
            Register
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default RegisterRoute;
