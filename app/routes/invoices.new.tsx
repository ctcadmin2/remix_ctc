import type { Company, CreditNote, Setting } from "@prisma/client";
import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { verifyAuthenticityToken } from "remix-utils";
import { z } from "zod";
import { zfd } from "zod-form-data";
import InvoiceForm from "~/forms/InvoiceForm";
import { db } from "~/utils/db.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";

type LoaderData = {
  creditNotes: Partial<CreditNote>[];
  clients: Partial<Company>[];
  currencies: Setting | null;
  vatRates: Setting | null;
};

const schema = zfd.formData({
  number: zfd.text(), //required
  date: zfd.text(z.string().datetime()), //required
  currency: zfd.text(), //required
  // vatRate: zfd.numeric(), //required
  clientId: zfd.numeric(), //required
  creditNotes: zfd.repeatableOfType(zfd.numeric(z.number().optional())),
  paid: zfd.checkbox(),
});

export const loader = async () => {
  const data: LoaderData = {
    creditNotes: await db.creditNote.findMany({
      where: { paid: false },
      select: { id: true, number: true, amount: true, currency: true },
    }),
    clients: await db.company.findMany({
      select: { country: true, id: true, name: true, vatValid: true },
    }),
    currencies: await db.setting.findUnique({
      where: { name: "currencies" },
    }),
    vatRates: await db.setting.findUnique({ where: { name: "vatRates" } }),
  };
  return json(data);
};

export const action: ActionFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));

  await verifyAuthenticityToken(request, session);

  // const data = schema.parse(await request.formData());

  console.log((await request.formData()).getAll("creditNotes"));

  // const { clientId, creditNotes, ...rest } = data;

  // let invoice = await db.invoice.create({
  //   data: {
  //     ...rest,
  //     client: {
  //       connect: { id: clientId },
  //     },
  //     ...(creditNotes
  //       ? {
  //           creditNotes: {
  //             connect: { id: creditNotes },
  //           },
  //         }
  //       : {}),
  //   },
  // });

  // if (invoice) {
  //   session.flash("toastMessage", "Invoice created successfully.");
  //   return redirect("/invoices", {
  //     headers: { "Set-Cookie": await commitSession(session) },
  //   });
  // }

  return null;
};

export default function NewInvoice() {
  return <InvoiceForm />;
}
