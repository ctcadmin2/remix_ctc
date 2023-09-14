import type {
  ActionArgs,
  ActionFunction,
  LoaderArgs,
  LoaderFunction,
} from "@remix-run/node";

import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { zfd } from "zod-form-data";
import { zx } from "zodix";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import { redirectBack, verifyAuthenticityToken } from "remix-utils";
import RepairForm from "~/forms/RepairForm";

const schema = zfd.formData({
  date: zfd.text(),
  km: zfd.numeric(),
  comment: zfd.text(),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { repairId } = zx.parseParams(params, {
    repairId: zx.NumAsString,
  });

  const data = {
    repair: await db.repair.findUnique({
      where: { id: repairId },
    }),
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

  const { repairId, vehicleId } = zx.parseParams(params, {
    repairId: zx.NumAsString,
    vehicleId: zx.NumAsString,
  });

  const session = await getSession(request.headers.get("Cookie"));
  try {
    await verifyAuthenticityToken(request, session);
  } catch (error) {
    return redirectBack(request, {
      fallback: `/vehicles/${vehicleId}/repairs`,
    });
  }

  const data = schema.parse(await request.formData());

  const repair = await db.repair.update({
    data,
    where: { id: repairId },
  });

  if (repair) {
    session.flash("toastMessage", "Repair updated successfully.");
    return redirectBack(request, {
      fallback: `/vehicle/${vehicleId}/repairs`,
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  session.flash("toastMessage", "Repair failed to update.");
  return redirectBack(request, {
    fallback: `/vehicle/${vehicleId}/repairs`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const EditRepair = () => {
  return <RepairForm />;
};

export default EditRepair;
