import type {
  ActionArgs,
  ActionFunction,
  LoaderArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { verifyAuthenticityToken } from "remix-utils";
import { z } from "zod";
import { zfd } from "zod-form-data";
import VehicleForm from "~/forms/VehicleForm";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";

const schema = zfd.formData({
  registration: zfd.text(z.string().optional()),
  vin: zfd.text(), //required
  category: zfd.text(z.string().optional()),
  active: zfd.checkbox(),
  nickname: zfd.text(z.string().optional()),
});

export const loader: LoaderFunction = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const data = {
    categories: await db.setting.findUnique({ where: { name: "vehCat" } }),
  };

  return json(data);
};

export const action: ActionFunction = async ({ request }: ActionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));
  await verifyAuthenticityToken(request, session);

  const data = schema.parse(await request.formData());

  const vehicle = await db.vehicle.create({
    data,
  });

  if (vehicle) {
    session.flash("toastMessage", "Vehicle created successfully.");
    return redirect("/vehicles", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

export default function NewCreditNote() {
  return <VehicleForm />;
}
