import { hydrateRoot } from "react-dom/client";
import { RemixBrowser } from "@remix-run/react";
import { ClientProvider } from "@mantine/remix";

hydrateRoot(
  document,
  <ClientProvider>
    <RemixBrowser />
  </ClientProvider>
);
