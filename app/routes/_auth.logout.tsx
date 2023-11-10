import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

import { authenticator } from "~/utils/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
};
