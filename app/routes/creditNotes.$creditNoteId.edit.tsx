import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import CreditNoteForm from "~/forms/CreditNoteForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  orderNr: zfd.numeric(z.number().optional()),
  number: zfd.text(), //required
  amount: zfd.numeric(), //required
  currency: zfd.text(), //required
  start: zfd.text(z.string().optional()),
  end: zfd.text(z.string().optional()),
  week: zfd.numeric(z.number().optional()),
  notes: zfd.text(z.string().optional()),
  vehicleId: zfd.numeric(z.number().optional()),
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

  const { creditNoteId } = zx.parseParams(params, {
    creditNoteId: zx.NumAsString,
  });

  const data = {
    creditNote: await db.creditNote.findUnique({
      where: { id: creditNoteId },
    }),
    vehicles: await db.vehicle.findMany({
      select: {
        id: true,
        registration: true,
      },
      where: {
        // category: 'camion',
        active: true,
      },
    }),
    currencies: await db.setting.findUnique({ where: { name: "currencies" } }),
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

  const { creditNoteId } = zx.parseParams(params, {
    creditNoteId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  const { vehicleId, files, ...rest } = data;

  try {
    const creditNote = await db.creditNote.update({
      data: {
        ...rest,
        ...(vehicleId
          ? {
              vehicle: {
                connect: { id: vehicleId },
              },
            }
          : {}),
      },
      where: { id: creditNoteId },
    });

    if (creditNote) {
      if (files[0]) {
        await FileUploader(files as Blob[], "creditNote", creditNoteId);
      }
      return redirectWithSuccess(
        "/creditNotes",
        "Credit note edited successfully.",
      );
    } else {
      return jsonWithError(null, "Credit note could not be edited.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

export default function EditCreditNote() {
  const { creditNote, vehicles, currencies } = useLoaderData<typeof loader>();

  return (
    <CreditNoteForm
      creditNote={creditNote}
      currencies={currencies?.value ?? []}
      vehicles={vehicles}
    />
  );
}
