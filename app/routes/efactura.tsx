import { Prisma } from "@prisma/client";
import type {
  LoaderFunctionArgs,
  LoaderFunction,
  ActionFunction,
  ActionFunctionArgs,
} from "@remix-run/node";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { NumAsString, parseForm } from "zodix";

import { db } from "~/utils/db.server";
import { upload, validate } from "~/utils/efactura.server";

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
  console.log("loader");

  // const { id, validate } = parseQuery(request, {
  //   id: NumAsString,
  //   validate: BoolAsString,
  // });

  // const invoice = await db.invoice.findUnique({ where: { id } });

  return null;
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
      console.log(data);
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
