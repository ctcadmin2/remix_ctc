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

import DocumentForm from "~/forms/DocumentForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  description: zfd.text(),
  expire: zfd.text(z.string().optional()),
  comment: zfd.text(z.string().optional()),
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined)),
  ),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
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
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { documentId, vehicleId } = zx.parseParams(params, {
    documentId: zx.NumAsString,
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

  const { files, ...data } = schema.parse(await request.formData());

  try {
    const document = await db.document.update({
      data,
      where: { id: documentId },
    });

    if (document) {
      if (files[0]) {
        await FileUploader(files as Blob[], "document", document.id);
        redirectWithSuccess(
          `/vehicles/${vehicleId}/documents`,
          "Document was edited successfully.",
        );
      } else {
        jsonWithError(null, "Document could not be edited.");
      }
    }
  } catch (error) {
    jsonWithError(null, `An error has occured: ${error}`);
  }
};

const EditRepair = () => {
  return <DocumentForm />;
};

export default EditRepair;
