import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { redirectWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

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
    zfd.file(z.instanceof(Blob).optional().catch(undefined))
  ),
});

export const loader = async () => {
  const data = {
    expense: null,
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

  const { supplierId, files, ...rest } = data;

  try {
    const expense = await db.nationalExpense.create({
      data: {
        ...rest,
        supplier: {
          connect: { id: supplierId },
        },
      },
    });

    if (files[0]) {
      await FileUploader(files as Blob[], "nationalExpense", expense.id);
    }

    return redirectWithSuccess(
      "/nationalExpenses",
      "Expense added successfully."
    );
  } catch (error) {
    console.error(error);
    return jsonWithError(null, `There has been and error: ${error}`);
  }
};

export default function NewNationalExpense() {
  return <NationalExpenseForm />;
}
