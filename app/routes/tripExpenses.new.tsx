import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

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

export const loader = async () => {
  const data = {
    expense: null,
    currencies: await db.setting.findUnique({
      where: { name: "currencies" },
    }),
    descriptions: await db.setting.findUnique({
      where: { name: "descriptions" },
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
    } else {
      console.log("other error");
    }
  }

  const data = schema.parse(await request.formData());

  const { files, ...rest } = data;

  try {
    const expense = await db.tripExpense.create({
      data: {
        ...rest,
      },
    });

    if (expense) {
      if (files[0]) {
        await FileUploader(files as Blob[], "tripExpense", expense.id);
      }

      return redirectWithSuccess(
        "/tripExpenses",
        "Expense added successfully.",
      );
    } else {
      return jsonWithError(null, "Expense could not be created.");
    }
  } catch (error) {
    return jsonWithError(null, `There has been and error: ${error}`);
  }
};

export default function NewTripExpense() {
  return <TripExpenseForm />;
}
