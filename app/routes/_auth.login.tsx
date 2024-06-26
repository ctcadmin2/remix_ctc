import {
  Button,
  Container,
  Paper,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useSearchParams } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";

import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
    failureRedirect: DEFAULT_REDIRECT,
  });
};

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
};

const LoginPage = () => {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+.\S+$/.test(value) ? null : "Invalid email"),
    },
  });
  const [searchParams] = useSearchParams();

  return (
    <Container size={600} my={60}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") || "/login"}
          />
          <TextInput
            name="email"
            label="Email"
            placeholder="you@mail.org"
            required
            {...form.getInputProps("email")}
          />
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Your password"
            required
            {...form.getInputProps("password")}
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default LoginPage;
