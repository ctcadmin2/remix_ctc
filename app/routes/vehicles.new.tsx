import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

import VehicleForm from "~/forms/VehicleForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  registration: zfd.text(z.string().optional()),
  vin: zfd.text(), //required
  category: zfd.text(z.string().optional()),
  active: zfd.checkbox(),
  nickname: zfd.text(z.string().optional()),
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const categories = await db.setting.findUnique({ where: { name: "vehCat" } });

  return json(categories);
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    }
    console.log("other error");
  }

  const data = schema.parse(await request.formData());

  try {
    const vehicle = await db.vehicle.create({
      data,
    });

    if (vehicle) {
      return redirectWithSuccess(
        "/vehicles",
        "Vehicle was created successfully.",
      );
    } else {
      return jsonWithError(null, "Vehicle could not be created.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

export default function NewCreditNote() {
  const categories = useLoaderData<typeof loader>();

  return <VehicleForm categories={categories?.value ?? []} />;
}
