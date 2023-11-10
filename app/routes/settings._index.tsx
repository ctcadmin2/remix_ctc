import { Tabs } from "@mantine/core";
import { useSearchParams, useLoaderData } from "@remix-run/react";
import type { Setting } from "@prisma/client";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import { z } from "zod";
import { zx } from "zodix";
import Single from "~/components/Settings/Single";
import Multi from "~/components/Settings/Multi";
import { redirect, type ActionFunction } from "@remix-run/node";
import { zfd } from "zod-form-data";
import sortSettings from "~/utils/sortSettings";
import { CSRFError } from "remix-utils/csrf/server";
import { csrf } from "~/utils/csrf.server";

type LoaderData = {
  settings: Setting[];
};

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
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    }
    console.log("other error");
  }

  const data = schema.parse(await request.formData());

  const { name, value } = data;

  let setting = await db.setting.update({
    where: { name },
    data: { value: value },
  });

  if (setting) {
    //TODO fix flash for multiple changes
    session.flash("toastMessage", "Settings updated successfully.");
    return redirect("/settings", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useLoaderData();

  return (
    <Tabs
      radius="xs"
      value={searchParams.get("type") || "main"}
      onChange={(tab: string) => {
        searchParams.set("type", tab);
        setSearchParams(searchParams);
      }}
      keepMounted={false}
    >
      <Tabs.List>
        <Tabs.Tab value="main">Main</Tabs.Tab>
        <Tabs.Tab value="company">Company</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="main" pl="xs">
        {settings.sort(sortSettings).map((setting: Setting) => {
          if (setting.multi === false) {
            return (
              <Single
                key={setting.id}
                name={setting.name}
                value={setting.value[0]}
              />
            );
          } else {
            return (
              <Multi
                key={setting.id}
                name={setting.name}
                value={setting.value}
              />
            );
          }
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
          } else {
            return <li key={setting.id}>{setting.name}</li>;
          }
        })}
      </Tabs.Panel>
    </Tabs>
  );
};

export default Settings;
