import { useLoaderData } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

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

export const loader = async () => {
  const data = {
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

export const action: ActionFunction = async ({ request }) => {
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

  const { vehicleId, files, ...rest } = data;

  try {
    const creditNote = await db.creditNote.create({
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
    });

    if (creditNote) {
      if (files[0]) {
        await FileUploader(files as Blob[], "creditNote", creditNote.id);
      }
      return redirectWithSuccess(
        "/creditNotes",
        "Credit note created successfully.",
      );
    }
    return jsonWithError(null, "Credit note could not be created.");
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

export default function NewCreditNote() {
  const { vehicles, currencies } = useLoaderData<typeof loader>();

  return (
    <CreditNoteForm vehicles={vehicles} currencies={currencies?.value ?? []} />
  );
}
