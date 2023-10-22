import "@mantine/core/styles.css";

import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { cssBundleHref } from "@remix-run/css-bundle";
import { json } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
  useSubmit,
} from "@remix-run/react";
import {
  MantineProvider,
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Paper,
  Title,
  ColorSchemeScript,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import LinksGroup from "./components/LinksGroup/LinksGroup";
import { Notifications, showNotification } from "@mantine/notifications";
import {
  authenticator,
  commitSession,
  getSession,
} from "./utils/session.server";
import type { User } from "@prisma/client";
import { useEffect, useState } from "react";
import {
  AuthenticityTokenProvider,
  createAuthenticityToken,
} from "remix-utils";
import { theme } from "./theme";

export const meta: MetaFunction = () => {
  return [
    { title: "CTC Admin 2" },
    { viewport: "width=device-width,initial-scale=1" },
  ];
};

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

interface LoaderData {
  csrf: string;
  user: Partial<User> | null | Error;
  toastMessage: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);

  const session = await getSession(request.headers.get("cookie"));
  const token = createAuthenticityToken(session);
  const toastMessage = session.get("toastMessage") || null;

  return json<LoaderData>(
    { csrf: token, user, toastMessage },
    { headers: { "Set-Cookie": await commitSession(session) } }
  );
};

const navLinks = [
  { label: "Vehicles", path: "vehicles" },
  { label: "Invoices", path: "invoices" },
  { label: "Credit Notes", path: "creditNotes" },
  {
    label: "Expenses",
    path: "expenses",
    links: [
      { label: "National Expenses", path: "nationalExpenses" },
      { label: "International Expenses", path: "internationalExpenses" },
      { label: "Trip Expenses", path: "tripExpenses" },
    ],
  },
  { label: "Employees", path: "employees" },
  { label: "Companies", path: "companies" },
  { label: "Settings", path: "settings" },
];

export function ErrorBoundary() {
  const error = useRouteError();

  // when true, this is what used to go to `CatchBoundary`
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>Oops</h1>
        <p>Status: {error.status}</p>
        <p>{error.data}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Uh oh ...</h1>
      <p>Something went wrong.</p>
      <pre>{error.message}</pre>
    </div>
  );
}

export default function App() {
  let location = useLocation();
  let [linkPath, setLinkPath] = useState({ name: "", to: "" });

  const { csrf, user, toastMessage } = useLoaderData<LoaderData>();
  const [opened, { toggle }] = useDisclosure(false);
  const submit = useSubmit();

  useEffect(() => {
    //TODO rework notifications
    if (!toastMessage) {
      return;
    }
    showNotification({ message: toastMessage });
  }, [toastMessage]);

  useEffect(() => {
    if (location.pathname === "/login") {
      setLinkPath({ name: "Register", to: "/register" });
    } else if (location.pathname === "/register") {
      setLinkPath({ name: "Login", to: "/login" });
    }
  }, [location]);

  const links = navLinks.map((item) => (
    <LinksGroup
      label={item.label}
      path={item.path}
      links={item.links}
      key={item.path}
    />
  ));

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>

      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <AppShell
            header={{ height: { base: 60, md: 70, lg: 80 } }}
            navbar={{
              width: { base: 200, md: 300, lg: 400 },
              breakpoint: "sm",
              collapsed: { mobile: !opened },
            }}
            padding="md"
            // navbarOffsetBreakpoint={user ? "sm" : undefined}
            // navbar={
            // }
          >
            <AppShell.Header>
              <Group position="apart" grow>
                <Group position="apart">
                  <Burger
                    opened={opened}
                    onClick={toggle}
                    size="md"
                    hiddenFrom="sm"
                    display={!user ? "none" : "inline"}
                  />
                  <Title order={3} weight={"bolder"}>
                    CTCAdmin 2
                  </Title>
                </Group>
                <Group position="right">
                  <Button>Language</Button>

                  {user && (
                    <Button
                      type="submit"
                      onClick={() =>
                        submit(null, { method: "post", action: "/logout" })
                      }
                    >
                      Logout
                    </Button>
                  )}
                  {!user && (
                    <Button component={Link} to={linkPath.to}>
                      {linkPath.name}
                    </Button>
                  )}
                </Group>
              </Group>
            </AppShell.Header>

            <AppShell.Navbar
              p="md"
              h={"85vh"}
              style={{ marginTop: "16px" }}
              hidden={!opened}
              w={{ sm: 250 }}
              withBorder
            >
              {links}
            </AppShell.Navbar>
            <AppShell.Main>
              <Paper
                shadow="sm"
                radius="md"
                p="xl"
                withBorder
                style={{ height: "85vh" }}
              >
                <Container fluid px={0}>
                  <AuthenticityTokenProvider token={csrf}>
                    <Outlet />
                  </AuthenticityTokenProvider>
                </Container>
              </Paper>
            </AppShell.Main>
          </AppShell>
          <Scripts />
          <LiveReload />
        </MantineProvider>
      </body>
    </html>
  );
}
