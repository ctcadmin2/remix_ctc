import "@mantine/core/styles.layer.css";
import "mantine-datatable/styles.layer.css";

import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";
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
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

import LinksGroup from "./components/LinksGroup/LinksGroup";
import { Notifications, showNotification } from "@mantine/notifications";
import { authenticator, getSession } from "./utils/session.server";
import type { User } from "@prisma/client";
import { useEffect, useState } from "react";
import { theme } from "./theme";
import { csrf } from "./utils/csrf.server";

export const meta: MetaFunction = () => {
  return [
    { title: "CTC Admin 2" },
    { viewport: "width=device-width,initial-scale=1" },
  ];
};

interface LoaderData {
  csrf: string;
  user: Partial<User> | null | Error;
  toastMessage: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request);

  const session = await getSession(request.headers.get("cookie"));
  let [token, cookieHeader] = await csrf.commitToken();

  const toastMessage = session.get("toastMessage") || null;

  return json<LoaderData>(
    { csrf: token, user, toastMessage },
    { headers: { "Set-Cookie": cookieHeader } }
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
            padding={"md"}
            header={{ height: 60 }}
            navbar={{
              width: 200,
              breakpoint: "sm",
              collapsed: { mobile: !opened, desktop: !user },
            }}
          >
            <AppShell.Header p={"md"}>
              <Group justify="apart" grow>
                <Group justify="apart">
                  <Burger
                    opened={opened}
                    onClick={toggle}
                    size="md"
                    hiddenFrom="sm"
                    display={!user ? "none" : "inline"}
                  />
                  <Title order={3} fw={"bolder"}>
                    CTCAdmin 2
                  </Title>
                </Group>
                <Group justify="right">
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

            <AppShell.Navbar pl="md" mt={"1rem"} h={"85vh"} hidden={true}>
              <AppShell.Section grow component={ScrollArea}>
                {links}
              </AppShell.Section>
            </AppShell.Navbar>
            <AppShell.Main>
              <Paper
                shadow="sm"
                radius="md"
                p="xl"
                withBorder
                style={{ height: "85vh", width: "auto" }}
              >
                <Container fluid px={0}>
                  <AuthenticityTokenProvider token={csrf}>
                    <Outlet />
                  </AuthenticityTokenProvider>
                </Container>
              </Paper>
            </AppShell.Main>
          </AppShell>
          <LiveReload />
          <Scripts />
        </MantineProvider>
      </body>
    </html>
  );
}
