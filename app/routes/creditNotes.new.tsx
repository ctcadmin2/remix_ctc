import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

import CreditNoteForm from "~/forms/CreditNoteForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
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
    zfd.file(z.instanceof(Blob).optional().catch(undefined))
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

  const session = await getSession(request.headers.get("Cookie"));

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
    session.flash("toastMessage", "Credit note updated successfully.");
    return redirect("/creditNotes", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

export default function NewCreditNote() {
  return <CreditNoteForm />;
}
