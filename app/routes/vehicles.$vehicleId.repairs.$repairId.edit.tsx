import { useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import RepairForm from "~/forms/RepairForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  date: zfd.text(),
  km: zfd.numeric(),
  comment: zfd.text(),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { repairId } = zx.parseParams(params, {
    repairId: zx.NumAsString,
  });

  const repair = await db.repair.findUnique({
    where: { id: repairId },
  });

  return json(repair);
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { repairId, vehicleId } = zx.parseParams(params, {
    repairId: zx.NumAsString,
    vehicleId: zx.NumAsString,
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
    const repair = await db.repair.update({
      data,
      where: { id: repairId },
    });

    if (repair) {
      return redirectWithSuccess(
        `/vehicle/${vehicleId}/repairs`,
        "Repair data was edited successfully.",
      );
    } else {
      return jsonWithError(null, "Repair data could not be edited.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

const EditRepair = () => {
  const repair = useLoaderData<typeof loader>();
  return <RepairForm repair={repair} />;
};

export default EditRepair;
