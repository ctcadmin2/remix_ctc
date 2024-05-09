import { Alert, Text } from "@mantine/core";
import { LoaderFunction, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { Server } from "react-feather";

import { authenticator, DEFAULT_REDIRECT } from "~/utils/session.server";

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
};

export default function NotFound() {
  return (
    <Alert variant="light" color="red" title="Routing error" icon={<Server />}>
      <Text>Your data got lost somewhere on the way.</Text>
    </Alert>
  );
}
