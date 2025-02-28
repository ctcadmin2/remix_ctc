import type { Prisma, Setting } from "@prisma/client";
import { json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { zx } from "zodix";

import InvoiceForm from "~/components/forms/InvoiceForm";
import type { CompaniesListType } from "~/components/lists/CompanyList";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  calculateAmount,
  schema,
  updateIdentification,
  updateOrders,
} from "~/utils/invoiceUtils.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

import { parseWithZod } from "@conform-to/zod";

export type InvoiceType = Prisma.InvoiceGetPayload<{
  include: {
    creditNotes: { select: { id: true } };
    orders: true;
    identification: { select: { expName: true; expId: true; expVeh: true } };
  };
}>;

export type InvoiceCreditNoteType = Prisma.CreditNoteGetPayload<{
  select: { id: true; number: true; amount: true; currency: true };
}>;

interface LoaderData {
  invoice: InvoiceType | null;
  creditNotes: InvoiceCreditNoteType[] | null;
  currencies: Setting | null;
  clients: CompaniesListType[];
  vatRates: Setting | null;
}

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
      include: {
        creditNotes: { select: { id: true } },
        orders: true,
        identification: {
          select: { expName: true, expId: true, expVeh: true },
        },
      },
    }),
    creditNotes: await db.creditNote.findMany({
      where: {
        OR: [
          { invoiceId: { equals: null } },
          { invoiceId: { equals: invoiceId } },
        ],
      },
      select: { id: true, number: true, amount: true, currency: true },
    }),

    clients: await db.company.findMany({
      select: { id: true, name: true },
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

  const formData = await request.formData();
  const data = parseWithZod(formData, { schema });

  if (data.status === "success") {
    const { clientId, creditNotesIds, identification, orders, ...rest } =
      data.value;

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
      rest.date
    );

    try {
      const invoice = await db.invoice.update({
        where: { id: invoiceId },
        data: {
          ...rest,
          amount: amountValue.amount,
          bnr: amountValue.bnr,
          bnrAt: amountValue.bnrAt,
          client: {
            connect: { id: clientId },
          },
          creditNotes: {
            set: creditNotesIds
              ?.split(",")
              .map((cn) => ({ id: Number.parseInt(cn) })),
          },
          ...updateIdentification(identification),
          ...updateOrders(orders),
        },
      });

      if (invoice) {
        return redirectWithSuccess("/invoices", "Invoice edited successfully.");
      }
      return jsonWithError(null, "Invoice could not be edited.");
    } catch (error) {
      return jsonWithError(null, `An error has occured: ${error}`);
    }
  }
  console.log(data.error);
  return jsonWithError(null, `error:`);
};

export default function EditCreditNote() {
  const { invoice, creditNotes, currencies, vatRates, clients } =
    useLoaderData<typeof loader>();

  return (
    <InvoiceForm
      invoice={invoice}
      creditNotes={creditNotes}
      currencies={currencies?.value ?? []}
      vatRates={vatRates?.value ?? []}
      clients={clients}
    />
  );
}
