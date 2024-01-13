import type { Setting, Prisma } from "@prisma/client";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import Decimal from "decimal.js";
import { CSRFError } from "remix-utils/csrf/server";
import { zx } from "zodix";

import InvoiceForm from "~/forms/InvoiceForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  calculateAmount,
  schema,
  updateIdentification,
  updateOrders,
} from "~/utils/invoiceUtils.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";

export interface LoaderData {
  invoice: Prisma.InvoiceGetPayload<{
    include: {
      creditNotes: { select: { id: true } };
      orders: true;
      identification: { select: { expName: true; expId: true; expVeh: true } };
    };
  }> | null;
  creditNotes:
    | {
        id: number;
        number: string;
        amount: Decimal;
        currency: string;
      }[]
    | null;
  currencies: Setting | null;
  clients: { id: number; name: string }[];
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
    rest.date
  );

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
        set: creditNotesIds?.split(",").map((cn) => ({ id: parseInt(cn) })),
      },
      ...updateIdentification(identification),
      ...updateOrders(orders),
    },
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
