import type { Company } from "@prisma/client";
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
import { zx } from "zodix";

import CompanyForm from "~/forms/CompanyForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

interface CheckboxOpts {
  trueValue?: string;
}

const checkbox = ({ trueValue = "on" }: CheckboxOpts = {}) =>
  z.union([
    z.literal(trueValue).transform(() => true),
    z.literal(undefined).transform(() => false),
  ]);

const schema = z.object({
  name: z.string().optional(),
  registration: z.string().optional(),
  vatNumber: z.string(),
  vatValid: checkbox(),
  accRon: z.string().optional(),
  accEur: z.string().optional(),
  address: z.string().optional(),
  county: z.string().optional(),
  country: z.string(),
  bank: z.string().optional(),
  capital: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
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

  const formPayload = Object.fromEntries(await request.formData());
  const data = schema.parse(formPayload);

  try {
    const company = await db.company.update({
      where: { id: companyId },
      data,
    });
    if (company) {
      return redirectWithSuccess("/companies", "Company updated successfully.");
    }
    return jsonWithError(null, "Company could not be updated.");
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditCompany() {
  const company = useLoaderData<typeof loader>();
  return <CompanyForm data={company} />;
}
