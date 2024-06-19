import {
  Button,
  Container,
  NativeSelect,
  Paper,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Form, useActionData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { useEffect } from "react";
import { jsonWithError, redirectWithInfo } from "remix-toast";
import { z } from "zod";

import { db } from "~/utils/db.server";
import { authenticator, register } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formPayload = Object.fromEntries(await request.formData());

  const schema = z
    .object({
      firstName: z.string().min(1, { message: "First name is required" }),
      lastName: z.string().min(1, { message: "Last name is required" }),
      email: z
        .string()
        .min(1, { message: "Email is required" })
        .email("Must be a valid email"),
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters." }),

      passCheck: z.string(),
      language: z.union([z.literal("en"), z.literal("ro")]),
    })
    .superRefine(async (form, ctx) => {
      if (form.password !== form.passCheck) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["passCheck"],
          message: "Passwords must match",
        });
      }

      if (
        await db.user.findFirst({
          where: { email: form.email },
        })
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Whoops! That username is taken.",
        });
      }
    });

  const formData = await schema.safeParseAsync(formPayload);

  //process and return form errors
  if (!formData.success) {
    let errors = {};
    formData.error.issues.map((i) => {
      errors = { ...errors, [`${i.path[0]}`]: i.message };
      return;
    });

    return jsonWithError(
      { values: formPayload, errors },
      "There are errors on the form.",
    );
  }

  // try to add a new user
  try {
    // create the user
    const user = await register({ ...formData.data });

    if (!user) {
      return jsonWithError(
        { values: formPayload, errors: {} },
        "User could not be created.",
      );
    }

    return redirectWithInfo(
      "/login",
      "Account created, please wait for admin to activate it.",
    );
  } catch (_error) {
    return jsonWithError(
      { values: formPayload, errors: {} },
      "An error has occured",
    );
  }
};

const RegisterRoute = () => {
  const data = useActionData<typeof action>();

  const { getInputProps, setErrors } = useForm({
    initialValues: {
      firstName: data?.values.firstName ?? "",
      lastName: data?.values.lastName ?? "",
      email: data?.values.email ?? "",
      language: data?.values.language ?? "en",
      password: data?.values.password ?? "",
      passCheck: data?.values.passCheck ?? "",
    },
  });

  useEffect(() => {
    if (data?.errors) {
      setErrors(data.errors);
    }
  }, [data?.errors, setErrors]);

  return (
    <Container size={700} my={60}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Form method="POST" reloadDocument>
          <TextInput
            name="firstName"
            label="First Name"
            type="text"
            {...getInputProps("firstName")}
          />
          <TextInput
            name="lastName"
            label="Last Name"
            type="text"
            {...getInputProps("lastName")}
            mt="md"
          />
          <TextInput
            name="email"
            label="Email"
            type="email"
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
            type="password"
            {...getInputProps("password")}
            mt="md"
          />
          <PasswordInput
            name="passCheck"
            label="Confirm password"
            type="password"
            {...getInputProps("passCheck")}
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl">
            Register
          </Button>
        </Form>
      </Paper>
    </Container>
  );
};

export default RegisterRoute;
