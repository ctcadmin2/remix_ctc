import type { Company } from "@prisma/client";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import CompanyForm from "~/forms/CompanyForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  name: zfd.text(z.string().optional()),
  registration: zfd.text(z.string().optional()),
  vatNumber: zfd.text(),
  vatValid: zfd.checkbox(),
  accRon: zfd.text(z.string().optional()),
  accEur: zfd.text(z.string().optional()),
  address: zfd.text(z.string().optional()),
  country: zfd.text(),
  bank: zfd.text(z.string().optional()),
  capital: zfd.text(z.string().optional()),
  email: zfd.text(z.string().optional()),
  phone: zfd.text(z.string().optional()),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { companyId } = zx.parseParams(params, {
    companyId: zx.NumAsString,
  });

  const data: Company | null = await db.company.findUnique({
    where: { id: companyId },
  });

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

  const { companyId } = zx.parseParams(params, {
    companyId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  try {
    await db.company.update({
      where: { id: companyId },
      data,
    });
    return redirectWithSuccess("/companies", "Company updated successfully.");
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditCreditNote() {
  return <CompanyForm />;
}
