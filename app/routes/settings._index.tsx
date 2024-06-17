import { Tabs } from "@mantine/core";
import type { Setting } from "@prisma/client";
import { json, useLoaderData, useSearchParams } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import Multi from "~/components/Settings/Multi";
import Single from "~/components/Settings/Single";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import sortSettings from "~/utils/sortSettings";

interface LoaderData {
  settings: Setting[];
}

const schema = zfd.formData({
  name: zfd.text(),
  value: zfd.json(z.string().array().optional()),
});

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { type = "main" } = zx.parseQuery(request, {
    type: z.string().optional(),
  });

  const data: LoaderData = {
    settings: await db.setting.findMany({
      where: { type },
      orderBy: { multi: "asc" },
    }),
  };

  return json(data);
};

export const action: ActionFunction = async ({ request }) => {
  console.log("called");
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    } else {
      console.log("other error");
    }
  }

  const data = schema.parse(await request.formData());

  const { name, value } = data;

  const setting = await db.setting.update({
    where: { name },
    data: { value: value },
  });

  if (setting) {
    return jsonWithSuccess(null, "Settings updated successfully.");
  }
  return jsonWithError(null, "An error has occured.");
};

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useLoaderData<typeof loader>();

  return (
    <Tabs
      radius="xs"
      value={searchParams.get("type") || "main"}
      onChange={(tab: string | null) => {
        searchParams.set("type", tab || "main");
        setSearchParams(searchParams);
      }}
      keepMounted={false}
    >
      <Tabs.List>
        <Tabs.Tab value="main">Main</Tabs.Tab>
        <Tabs.Tab value="company">Company</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="main" pl="xs" mt="lg">
        {settings.sort(sortSettings).map((setting: Setting) => {
          if (setting.multi === false) {
            return (
              <Single
                key={setting.id}
                name={setting.name}
                value={setting.value[0]}
              />
            );
          }
          return (
            <Multi key={setting.id} name={setting.name} value={setting.value} />
          );
        })}
      </Tabs.Panel>

      <Tabs.Panel value="company" pl="xs">
        {settings.map((setting: Setting) => {
          if (setting.multi === false) {
            return (
              <Single
                key={setting.id}
                name={setting.name}
                value={setting.value[0]}
              />
            );
          }
          return <li key={setting.id}>{setting.name}</li>;
        })}
      </Tabs.Panel>
    </Tabs>
  );
};

export default Settings;
