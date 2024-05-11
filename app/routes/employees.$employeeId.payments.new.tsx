import { Prisma } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import Decimal from "decimal.js";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import PaymentForm from "~/forms/PaymentForm";
import bnrRate from "~/utils/bnrRate.server";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  month: zfd.text(z.string().datetime()),
  salaryRon: zfd.text(),
  indemnizations: z
    .array(
      z.object({
        id: zfd.text(z.string().optional()),
        period: zfd.text(),
        perDay: zfd.numeric(),
        avans: zfd.numeric(),
        delegation: zfd.checkbox(),
      }),
    )
    .optional(),
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const perDay = await db.setting.findUnique({
    where: { name: "perDay" },
    select: {
      name: true,
      value: true,
    },
  });

  const salary = await db.setting.findUnique({
    where: { name: "salary" },
    select: {
      name: true,
      value: true,
    },
  });

  return json({ perDay, salary });
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
  } catch (error) {
    if (error instanceof CSRFError) {
      console.error("csrf error", error);
    } else {
      console.error("other error", error);
    }
  }

  const { employeeId } = zx.parseParams(params, {
    employeeId: zx.NumAsString,
  });

  const { indemnizations, ...data } = schema.parse(await request.formData());

  const indemnizationsData: Prisma.IndemnizationCreateArgs["data"][] =
    indemnizations?.map((v) => {
      const dateRange = v.period.split(" – ");
      const indemnization = {
        startDate: dayjs(dateRange[0]).toDate(),
        days: dayjs(dateRange[1]).diff(dateRange[0], "days") + 1,
        avans: new Decimal(v.avans),
        perDay: v.perDay,
        delegation: v.delegation,
        rest: new Decimal(0),
        total: new Decimal(0),
      };
      indemnization.total = new Decimal(indemnization.perDay).times(
        indemnization.days,
      );
      indemnization.rest = new Decimal(indemnization.total).minus(
        indemnization.avans,
      );

      return indemnization;
    }) ?? [];

  try {
    const payment = await db.payment.create({
      data: {
        ...data,
        salaryEur: new Decimal(data.salaryRon).dividedBy(
          (await bnrRate(data.month, "EUR")).rate,
        ),
        employee: { connect: { id: employeeId } },
        ...(indemnizationsData.length > 0
          ? { indemnizations: { createMany: { data: indemnizationsData } } }
          : null),
      },
    });

    if (payment) {
      return redirectWithSuccess(
        `/employees/${employeeId}/payments`,
        "Payment created successfully.",
      );
    } else {
      return jsonWithError(null, "Payment could not be created.");
    }
  } catch (error) {
    console.error(error);
    return jsonWithError(error, "Payment could not be created.");
  }
};

const NewPayment = () => {
  const { perDay, salary } = useLoaderData<typeof loader>();
  return (
    <PaymentForm
      perDay={perDay.value[0] ?? "0"}
      salary={salary.value[0] ?? "0"}
    />
  );
};

export default NewPayment;
