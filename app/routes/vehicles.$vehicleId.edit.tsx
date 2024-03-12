import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

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
  params,
}: LoaderFunctionArgs) => {
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

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  try {
    const vehicle = await db.vehicle.update({
      data,
      where: { id: vehicleId },
    });

    if (vehicle) {
      return redirectWithSuccess(
        "/vehicles",
        "Vehicle was edited successfully.",
      );
    } else {
      return jsonWithError(null, "Vehicle could not be edited.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

export default function EditCreditNote() {
  return <VehicleForm />;
}
