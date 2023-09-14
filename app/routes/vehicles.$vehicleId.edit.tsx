import type {
  ActionArgs,
  ActionFunction,
  LoaderArgs,
  LoaderFunction,
} from "@remix-run/node";

import { json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { zx } from "zodix";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import VehicleForm from "~/forms/VehicleForm";
import { redirectBack, verifyAuthenticityToken } from "remix-utils";

const schema = zfd.formData({
  registration: zfd.text(z.string().optional()),
  vin: zfd.text(), //required
  category: zfd.text(z.string().optional()),
  active: zfd.checkbox(),
  nickname: zfd.text(z.string().optional()),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const data = {
    vehicle: await db.vehicle.findUnique({
      where: { id: vehicleId },
    }),

    categories: await db.setting.findUnique({ where: { name: "vehCat" } }),
  };

  return json(data);
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));
  try {
    await verifyAuthenticityToken(request, session);
  } catch (error) {
    return redirectBack(request, { fallback: "/vehicles" });
  }

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  const vehicle = await db.vehicle.update({
    data,
    where: { id: vehicleId },
  });

  if (vehicle) {
    session.flash("toastMessage", "Vehicle updated successfully.");
    return redirect("/vehicles", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

export default function EditCreditNote() {
  return <VehicleForm />;
}
