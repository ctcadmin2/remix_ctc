import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";

import { json, redirect } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { zfd } from "zod-form-data";
import { z } from "zod";
import { zx } from "zodix";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import InvoiceForm from "~/forms/InvoiceForm";
import type { Invoice, Setting } from "@prisma/client";
import { csrf } from "~/utils/csrf.server";
import { CSRFError } from "remix-utils/csrf/server";

type LoaderData = {
  invoice: Invoice | null;
  currencies: Setting | null;
  vatRates: Setting | null;
};

const schema = zfd.formData({
  number: zfd.text(),
  date: zfd.text(),
  dueDate: zfd.text(z.string().optional()),
  amount: zfd.text(),
  currency: zfd.text(),
  vatRate: zfd.numeric(),
  paid: zfd.checkbox(),
  creditNotes: zfd.text(),
  clientId: zfd.numeric(),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { invoiceId } = zx.parseParams(params, {
    invoiceId: zx.NumAsString,
  });

  const data: LoaderData = {
    invoice: await db.invoice.findUnique({
      where: { id: invoiceId },
    }),

    currencies: await db.setting.findUnique({ where: { name: "currencies" } }),
    vatRates: await db.setting.findUnique({ where: { name: "vatRates" } }),
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

  const session = await getSession(request.headers.get("Cookie"));

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    }
    console.log("other error");
  }

  const { invoiceId } = zx.parseParams(params, {
    invoiceId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  const invoice = await db.invoice.update({
    data,
    where: { id: invoiceId },
  });

  if (invoice) {
    session.flash("toastMessage", "Invoice updated successfully.");
    return redirect("/invoices", {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }
};

export default function EditCreditNote() {
  return <InvoiceForm />;
}
