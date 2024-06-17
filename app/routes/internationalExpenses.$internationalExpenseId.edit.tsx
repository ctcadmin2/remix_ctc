import { useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import InternationalExpenseForm from "~/forms/InternationalExpenseForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  number: zfd.text(), //required
  date: zfd.text(), //required
  amount: zfd.numeric(), //required
  description: zfd.text(), //required
  currency: zfd.text(), //required
  supplierId: zfd.numeric(), //required
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined)),
  ),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { internationalExpenseId } = zx.parseParams(params, {
    internationalExpenseId: zx.NumAsString,
  });

  const data = {
    expense: await db.internationalExpense.findUnique({
      where: { id: internationalExpenseId },
    }),
    suppliers: await db.company.findMany({
      where: { country: { not: { equals: "RO" } } },
      select: { id: true, name: true },
    }),
    currencies: await db.setting.findUnique({
      where: { name: "currencies" },
    }),
    descriptions: await db.setting.findUnique({
      where: { name: "descriptions" },
    }),
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
    console.log("csrf valid");
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error", error);
    } else {
      console.log("other error: ", error);
    }
  }

  const { internationalExpenseId } = zx.parseParams(params, {
    internationalExpenseId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());
  const { supplierId, files, ...rest } = data;

  try {
    const ie = await db.internationalExpense.update({
      where: { id: internationalExpenseId },
      data: {
        ...rest,
        supplier: {
          connect: { id: supplierId },
        },
      },
    });
    if (ie) {
      if (files[0]) {
        await FileUploader(
          files as Blob[],
          "internationalExpense",
          internationalExpenseId,
        );
      }
      return redirectWithSuccess(
        "/internationalExpenses",
        "Expense updated successfully.",
      );
    }
    return jsonWithError(null, "Expense could not be updated.");
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditInternationalExpense() {
  const { expense, suppliers, currencies, descriptions } =
    useLoaderData<typeof loader>();
  return (
    <InternationalExpenseForm
      expense={expense}
      suppliers={suppliers}
      currencies={currencies?.value ?? []}
      descriptions={descriptions?.value ?? []}
    />
  );
}
