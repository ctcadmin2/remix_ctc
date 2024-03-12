import type { Setting } from "@prisma/client";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import Decimal from "decimal.js";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";

import InvoiceForm from "~/forms/InvoiceForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import {
  calculateAmount,
  createIdentification,
  createOrders,
  schema,
} from "~/utils/invoiceUtils.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export interface LoaderData {
  creditNotes: {
    id: number;
    number: string;
    amount: Decimal;
    currency: string;
  }[];
  clients: { id: number; name: string }[];
  currencies: Partial<Setting> | null;
  vatRates: Partial<Setting> | null;
}

export const loader = async () => {
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
      select: { value: true },
    }),
    vatRates: await db.setting.findUnique({
      where: { name: "vatRates" },
      select: { value: true },
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
            .map((cn) => ({ id: parseInt(cn) })),
        },
        ...createIdentification(identification),
        ...createOrders(orders),
      },
    });

    if (invoice) {
      return redirectWithSuccess("/invoices", "Invoice created successfully.");
    } else {
      return jsonWithError(null, "Invoice could not be created.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

export default function NewInvoice() {
  return <InvoiceForm />;
}
