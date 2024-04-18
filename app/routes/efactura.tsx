import { Prisma } from "@prisma/client";
import type {
  LoaderFunctionArgs,
  LoaderFunction,
  ActionFunction,
  ActionFunctionArgs,
} from "@remix-run/node";
import {
  jsonWithError,
  jsonWithSuccess,
  redirectWithError,
  redirectWithSuccess,
} from "remix-toast";
import { NumAsString, parseForm, parseQuery, zx } from "zodix";

import { db } from "~/utils/db.server";
import { checkStatus, upload, validate } from "~/utils/efactura.server";

export type eInvoice = Prisma.InvoiceGetPayload<{
  include: {
    client: {
      select: {
        address: true;
        county: true;
        name: true;
        vatNumber: true;
        vatValid: true;
      };
    };
    EFactura: true;
    orders: true;
    creditNotes: { select: { amount: true; currency: true; number: true } };
  };
}> | null;

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  const { id } = parseQuery(request, {
    id: zx.NumAsString,
  });

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: { EFactura: true },
  });

  switch (invoice?.EFactura?.status) {
    case "uploaded": {
      const data = await checkStatus(id, invoice.EFactura.loadIndex);

      if (data?.stare === "ok") {
        return redirectWithSuccess("/invoices", "Invoice valid.");
      }
      return redirectWithError(
        "/invoices",
        `There have been ${data?.Errors?.length} errors.`,
      );
    }

    default:
      return jsonWithError(null, "No defined loader.");
  }
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  const { id } = await parseForm(request, {
    id: NumAsString,
  });

  const invoice: eInvoice = await db.invoice.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          address: true,
          county: true,
          name: true,
          vatNumber: true,
          vatValid: true,
        },
      },
      EFactura: true,
      orders: true,
      creditNotes: { select: { amount: true, currency: true, number: true } },
    },
  });

  switch (invoice?.EFactura?.status) {
    case undefined:
    case "nproc": {
      const data = await validate(invoice);

      if (data.stare === "ok") {
        return jsonWithSuccess(null, "XML validated");
      }
      return jsonWithError(
        data.Messages,
        `There have been ${data.Messages.length} errors.`,
      );
    }
    case "validated": {
      const data = await upload(invoice);

      if (data?.stare === "ok") {
        return jsonWithSuccess(null, data.message);
      }

      return jsonWithError(null, data?.message);
    }
    default:
      return jsonWithError(null, "No defined action.");
  }
};
