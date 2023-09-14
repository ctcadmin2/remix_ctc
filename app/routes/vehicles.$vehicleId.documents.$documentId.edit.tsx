import type {
  ActionArgs,
  ActionFunction,
  LoaderArgs,
  LoaderFunction,
} from "@remix-run/node";

import { json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { zfd } from "zod-form-data";
import { zx } from "zodix";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import { verifyAuthenticityToken } from "remix-utils";
import DocumentForm from "~/forms/DocumentForm";
import { z } from "zod";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  description: zfd.text(),
  expire: zfd.text(z.string().optional()),
  comment: zfd.text(z.string().optional()),
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined))
  ),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { documentId } = zx.parseParams(params, {
    documentId: zx.NumAsString,
  });

  const data = {
    document: await db.document.findUnique({
      where: { id: documentId },
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

  const { documentId, vehicleId } = zx.parseParams(params, {
    documentId: zx.NumAsString,
    vehicleId: zx.NumAsString,
  });

  const session = await getSession(request.headers.get("Cookie"));
  try {
    await verifyAuthenticityToken(request, session);
  } catch (error) {
    return redirect(`/vehicles/${vehicleId}/documents`);
  }

  const { files, ...data } = schema.parse(await request.formData());

  const document = await db.document.update({
    data,
    where: { id: documentId },
  });

  if (document) {
    if (files[0]) {
      await FileUploader(files as Blob[], "document", document.id);
    }
    session.flash("toastMessage", "Document updated successfully.");
    return redirect(`/vehicles/${vehicleId}/documents`, {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  session.flash("toastMessage", "Document failed to update.");
  return redirect(`/vehicles/${vehicleId}/documents`, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const EditRepair = () => {
  return <DocumentForm />;
};

export default EditRepair;
