import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DocumentForm from "~/forms/DocumentForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  description: zfd.text(),
  expire: zfd.text(
    z
      .string()
      .optional()
      .transform((value) => {
        return value === "" || value === undefined ? null : value;
      }),
  ),
  comment: zfd.text(z.string().optional()),
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined)),
  ),
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return json(null);
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

  const form = schema.parse(await request.formData());

  const { files, ...data } = form;

  try {
    const document = await db.document.create({
      data: { vehicleId, ...data },
    });

    if (document) {
      if (files[0]) {
        await FileUploader(files as Blob[], "document", document.id);
      }
      return redirectWithSuccess(
        `/vehicles/${vehicleId}/documents`,
        "Document was created successfully.",
      );
    }
    return jsonWithError(null, "Document could not be created.");
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

const NewDocument = () => {
  return <DocumentForm />;
};

export default NewDocument;
