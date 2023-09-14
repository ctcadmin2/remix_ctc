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
import { zx } from "zodix";
import DocumentForm from "~/forms/DocumentForm";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  description: zfd.text(),
  expire: zfd.text(z.string().optional()),
  comment: zfd.text(z.string().optional()),
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined))
  ),
});

export const loader: LoaderFunction = async ({ request }: LoaderArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return json({ document: undefined });
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));
  await verifyAuthenticityToken(request, session);

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const form = schema.parse(await request.formData());

  const { files, ...data } = form;

  const document = await db.document.create({
    data: { vehicleId, ...data },
  });

  if (document) {
    if (files[0]) {
      await FileUploader(files as Blob[], "document", document.id);
    }
    session.flash("toastMessage", "Document created successfully.");
  } else {
    session.flash("toastMessage", "Document could not be created.");
  }

  return redirect(`/vehicles/${vehicleId}/documents`, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const NewDocument = () => {
  return <DocumentForm />;
};

export default NewDocument;
