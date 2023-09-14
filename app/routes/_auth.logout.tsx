import type { ActionArgs, LoaderArgs } from "@remix-run/node";

import { authenticator } from "~/utils/session.server";

export const action = async ({ request }: ActionArgs) => {
  await authenticator.logout(request, { redirectTo: "/login" });
};

export const loader = async ({ request }: LoaderArgs) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
};
