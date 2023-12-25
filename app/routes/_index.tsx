import type { LoaderFunction } from "@remix-run/node";

import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });
};

const Main = () => {
  return <p>Main</p>;
};

export default Main;
