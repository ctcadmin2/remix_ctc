import { Prisma } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { pdf } from "remix-utils/responses";

import { db } from "~/utils/db.server";
import generateInvoicePDF from "~/utils/pdf/generateInvoicePDF.server";
import { authenticator, DEFAULT_REDIRECT } from "~/utils/session.server";

export interface InvoiceData {
  invoice: Prisma.InvoiceGetPayload<{
    include: {
      client: true;
      creditNotes: { select: { number: true; amount: true; currency: true } };
      orders: {
        select: {
          description: true;
          quantity: true;
          amount: true;
          total: true;
        };
      };
      identification: { select: { expName: true; expId: true; expVeh: true } };
    };
  }>;
}

export type CompanyInfo = Prisma.SettingGetPayload<{
  select: {
    name: true;
    value: true;
  };
}>;

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const invoice = await db.invoice.findUnique({
    where: { id: parseInt(params.id as string) },
    include: {
      client: true,
      creditNotes: { select: { number: true, amount: true, currency: true } },
      orders: {
        select: {
          description: true,
          quantity: true,
          amount: true,
          total: true,
        },
      },
      identification: { select: { expName: true, expId: true, expVeh: true } },
    },
  });
  const company: CompanyInfo[] = await db.setting.findMany({
    where: { type: { equals: "company" } },
    select: { name: true, value: true },
  });

  return pdf(await generateInvoicePDF(invoice, company, user));
}
