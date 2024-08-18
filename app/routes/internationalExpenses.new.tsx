import { useLoaderData } from "@remix-run/react";
import type { ActionFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";

import InternationalExpenseForm from "~/components/forms/InternationalExpenseForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";
import FileUploader from "~/utils/uploader.server";

const schema = zfd.formData({
  number: zfd.text(), //required
  date: zfd.text(), //required
  amount: zfd.numeric(), //required
  currency: zfd.text(), //required
  description: zfd.text(), //required
  supplierId: zfd.numeric(), //required
  files: zfd.repeatableOfType(
    zfd.file(z.instanceof(Blob).optional().catch(undefined)),
  ),
});

export const loader = async () => {
  const data = {
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
    const expense = await db.internationalExpense.create({
      data: {
        ...rest,
        supplier: {
          connect: { id: supplierId },
        },
      },
    });

    if (expense) {
      if (files[0]) {
        await FileUploader(files as Blob[], "internationalExpense", expense.id);
      }
      return redirectWithSuccess(
        "/internationalExpenses",
        "Expense added successfully.",
      );
    }
    return jsonWithError(null, "Expense could not be created.");
  } catch (error) {
    return jsonWithError(null, `There has been and error: ${error}`);
  }
};

export default function NewNationalExpense() {
  const { suppliers, currencies, descriptions } =
    useLoaderData<typeof loader>();
  return (
    <InternationalExpenseForm
      descriptions={descriptions?.value ?? []}
      suppliers={suppliers}
      currencies={currencies?.value ?? []}
    />
  );
}
