import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { CSRFError } from "remix-utils/csrf/server";
import { redirectBack } from "remix-utils/redirect-back";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import RepairForm from "~/forms/RepairForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";

const schema = zfd.formData({
  date: zfd.text(),
  km: zfd.numeric(),
  comment: zfd.text(),
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return json({ repair: undefined });
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
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

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  const repair = await db.repair.create({
    data: { vehicleId, ...data },
  });

  if (repair) {
    session.flash("toastMessage", "Repair created successfully.");
  } else {
    session.flash("toastMessage", "Repair could not be created.");
  }

  return redirectBack(request, {
    fallback: `/vehicle/${vehicleId}/repairs`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const NewRepair = () => {
  return <RepairForm />;
};

export default NewRepair;
