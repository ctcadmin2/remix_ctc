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

import TripExpenseForm from "~/forms/TripExpenseForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  intNr: zfd.numeric(), //required
  number: zfd.text(), //required
  date: zfd.text(), //required
  description: zfd.text(), //required
  amount: zfd.numeric(), //required
  currency: zfd.text(), //required
  amountEur: zfd.numeric(), //required
  card: zfd.checkbox(), //required
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

  const { tripExpenseId } = zx.parseParams(params, {
    tripExpenseId: zx.NumAsString,
  });

  const data = {
    expense: await db.tripExpense.findUnique({
      where: { id: tripExpenseId },
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

  const { tripExpenseId } = zx.parseParams(params, {
    tripExpenseId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());
  const { files, ...rest } = data;

  try {
    const expense = await db.tripExpense.update({
      where: { id: tripExpenseId },
      data: {
        ...rest,
      },
    });

    if (expense) {
      if (files[0]) {
        await FileUploader(files as Blob[], "tripExpense", tripExpenseId);
      }

      return redirectWithSuccess(
        "/tripExpenses",
        "Expense updated successfully.",
      );
    }
    return jsonWithError(null, "Expense could not be updated.");
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditNationalExpense() {
  const { expense, descriptions, currencies } = useLoaderData<typeof loader>();

  return (
    <TripExpenseForm
      expense={expense}
      descriptions={descriptions?.value ?? []}
      currencies={currencies?.value ?? []}
    />
  );
}
