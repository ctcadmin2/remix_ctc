import type { Setting } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";

import InvoiceForm from "~/forms/InvoiceForm";
import type { CompaniesListType } from "~/lists/CompanyList";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  calculateAmount,
  createIdentification,
  createOrders,
  schema,
} from "~/utils/invoiceUtils.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

import type { InvoiceCreditNoteType } from "./invoices.$invoiceId.edit";

interface LoaderData {
  creditNotes: InvoiceCreditNoteType[];
  clients: CompaniesListType[];
  currencies: Setting | null;
  vatRates: Setting | null;
}

export const loader: LoaderFunction = async () => {
  const data: LoaderData = {
    creditNotes: await db.creditNote.findMany({
      where: { invoiceId: null },
      select: { id: true, number: true, amount: true, currency: true },
    }),
    clients: await db.company.findMany({
      select: { id: true, name: true },
    }),
    currencies: await db.setting.findUnique({
      where: { name: "currencies" },
    }),
    vatRates: await db.setting.findUnique({
      where: { name: "vatRates" },
    }),
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

  const formPayload = Object.fromEntries(await request.formData());
  const data = schema.parse(formPayload);

  const { clientId, creditNotesIds, identification, orders, ...rest } = data;

  const creditNotes = await db.creditNote.findMany({
    where: {
      id: { in: creditNotesIds?.split(",").map(Number) || [] },
    },
    select: {
      amount: true,
      currency: true,
    },
  });

  const amountValue = await calculateAmount(
    orders,
    creditNotes,
    rest.currency,
    rest.date,
  );

  try {
    const invoice = await db.invoice.create({
      data: {
        ...rest,
        amount: amountValue.amount,
        bnr: amountValue.bnr,
        bnrAt: amountValue.bnrAt,
        client: {
          connect: { id: clientId },
        },
        creditNotes: {
          connect: creditNotesIds
            ?.split(",")
            .map((cn) => ({ id: Number.parseInt(cn) })),
        },
        ...((await db.company.findUnique({ where: { id: clientId } }))
          ?.country === "RO"
          ? { EFactura: { create: { status: "nproc" } } }
          : {}),
        ...createIdentification(identification),
        ...createOrders(orders),
      },
    });

    if (invoice) {
      return redirectWithSuccess("/invoices", "Invoice created successfully.");
    }
    return jsonWithError(null, "Invoice could not be created.");
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

const NewInvoice = () => {
  const { creditNotes, currencies, vatRates, clients } =
    useLoaderData<typeof loader>();

  return (
    <InvoiceForm
      creditNotes={creditNotes}
      currencies={currencies?.value ?? []}
      vatRates={vatRates?.value ?? []}
      clients={clients}
    />
  );
};
export default NewInvoice;
