import { useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import NationalExpenseForm from "~/forms/NationalExpensesForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  number: zfd.text(), //required
  date: zfd.text(), //required
  amount: zfd.numeric(), //required
  description: zfd.text(), //required
  paidBy: zfd.text(z.string().optional()),
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

  const { nationalExpenseId } = zx.parseParams(params, {
    nationalExpenseId: zx.NumAsString,
  });

  const data = {
    expense: await db.nationalExpense.findUnique({
      where: { id: nationalExpenseId },
    }),
    suppliers: await db.company.findMany({
      where: { country: { equals: "RO" } },
      select: { id: true, name: true },
    }),
    paymentOptions: await db.setting.findUnique({
      where: { name: "paymentOptions" },
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

  const { nationalExpenseId } = zx.parseParams(params, {
    nationalExpenseId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());
  const { supplierId, files, ...rest } = data;

  try {
    const expense = await db.nationalExpense.update({
      where: { id: nationalExpenseId },
      data: {
        ...rest,
        supplier: {
          connect: { id: supplierId },
        },
      },
    });

    if (expense) {
      if (files[0]) {
        await FileUploader(
          files as Blob[],
          "nationalExpense",
          nationalExpenseId,
        );
      }
      return redirectWithSuccess(
        "/nationalExpenses",
        "Expense updated successfully.",
      );
    } else {
      return jsonWithError(null, "Expense could not be updated.");
    }
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditNationalExpense() {
  const { expense, descriptions, suppliers, paymentOptions } =
    useLoaderData<typeof loader>();
  return (
    <NationalExpenseForm
      expense={expense}
      descriptions={descriptions?.value ?? []}
      suppliers={suppliers}
      paymentOptions={paymentOptions?.value ?? []}
    />
  );
}
