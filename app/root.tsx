import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-datatable/styles.css";
import "dayjs/locale/en";
import "dayjs/locale/ro";

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
import { DatesProvider } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { json } from "@remix-run/node";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
  useSubmit,
} from "@remix-run/react";
import { type ReactNode, useEffect, useState } from "react";
import { getToast } from "remix-toast";
import { AuthenticityTokenProvider } from "remix-utils/csrf/react";

import LinksGroup from "./components/LinksGroup/LinksGroup";
import { theme } from "./theme";
import { csrf } from "./utils/csrf.server";
import handleNotification from "./utils/notifications";
import { authenticator } from "./utils/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "CTC Admin 2" },
    { viewport: "width=device-width,initial-scale=1" },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  // console.log("root loader");
  const user = await authenticator.isAuthenticated(request);

  // Headers prep for csrf and toasts
  const { toast, headers } = await getToast(request);
  const mainHeaders = new Headers(headers);
  const [token, csrfHeader] = await csrf.commitToken(request);
  if (csrfHeader) {
    mainHeaders.append("set-cookie", csrfHeader);
  }

  return json({ csrf: token, user, toast }, { headers: mainHeaders });
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

  let errorMessage: string;

  if (isRouteErrorResponse(error)) {
    // error is type `ErrorResponse`
    errorMessage = error.data || error.statusText;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    console.error(error);
    errorMessage = "Unknown error";
  }

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{errorMessage}</i>
      </p>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
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
        {/* children will be the root Component, ErrorBoundary, or HydrateFallback */}
        {children}
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();
  const [linkPath, setLinkPath] = useState({ name: "", to: "" });

  const { csrf, user, toast } = useLoaderData<typeof loader>();
  const [opened, { toggle }] = useDisclosure(false);
  const submit = useSubmit();

  useEffect(() => {
    if (toast) {
      handleNotification(toast);
    }
  }, [toast]);

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
    <MantineProvider theme={theme}>
      <ModalsProvider>
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
                  <Link to={"/"} reloadDocument>
                    CTCAdmin 2
                  </Link>
                </Title>
              </Group>
              <Group justify="right">
                <Button>Language</Button>

                {user ? (
                  <Button
                    type="submit"
                    onClick={() =>
                      submit(null, { method: "post", action: "/logout" })
                    }
                  >
                    Logout
                  </Button>
                ) : null}
                {!user ? (
                  <Button component={Link} to={linkPath.to}>
                    {linkPath.name}
                  </Button>
                ) : null}
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
                  <DatesProvider
                    settings={{
                      consistentWeeks: true,
                      locale: user ? user.language : "en",
                    }}
                  >
                    <Outlet />
                  </DatesProvider>
                </AuthenticityTokenProvider>
              </Container>
            </Paper>
          </AppShell.Main>
        </AppShell>
        <Scripts />
      </ModalsProvider>
    </MantineProvider>
  );
}
