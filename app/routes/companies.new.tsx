import { Company } from "@prisma/client";
import {
  ActionFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  json,
} from "@remix-run/server-runtime";
import {
  jsonWithError,
  jsonWithInfo,
  jsonWithSuccess,
  jsonWithWarning,
  redirectWithSuccess,
} from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";

import CompanyForm from "~/forms/CompanyForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import findCompany from "~/utils/findCompany.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

interface CheckboxOpts {
  trueValue?: string;
}

const checkbox = ({ trueValue = "on" }: CheckboxOpts = {}) =>
  z.union([
    z.literal(trueValue).transform(() => true),
    z.literal(undefined).transform(() => false),
  ]);

const schema = z.discriminatedUnion("_action", [
  z.object({
    _action: z.literal("search"),
    vatNumber: z.string(),
    country: z.string(),
  }),
  z.object({
    _action: z.literal("create"),
    name: z.string(),
    registration: z.string().optional(),
    vatNumber: z.string(),
    vatValid: checkbox(),
    accRon: z.string().optional(),
    accEur: z.string().optional(),
    address: z.string().optional(),
    country: z.string(),
    bank: z.string().optional(),
    capital: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
]);

interface SearchCompanyProps {
  data: Partial<Company> | null;
  status: number;
}

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  return json(null);
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

  const formPayload = Object.fromEntries(await request.formData());
  const { _action, ...rest } = schema.parse(formPayload);

  if (_action === "search") {
    const data: SearchCompanyProps = await findCompany(
      rest.country,
      rest.vatNumber,
    );
    switch (data.status) {
      case 200:
        return jsonWithSuccess(data.data, "Company found!");
      case 204:
        return jsonWithInfo(data.data, "Company already registered!");
      case 404:
        return jsonWithWarning(data.data, "Company could not be found.");
      case 503:
        return jsonWithError(data.data, "OpenAPI service unavailable.");
      default:
        return jsonWithError(data.data, "An error has occured.");
    }
  } else {
    try {
      if ("name" in rest) {
        const company = await db.company.create({
          data: rest,
        });
        if (company) {
          return redirectWithSuccess(
            "/companies",
            "Company was created successfully.",
          );
        } else {
          return jsonWithError(null, "Company could not be created.");
        }
      }
      return jsonWithError(null, "There has been an error.");
    } catch (error) {
      return jsonWithError(null, `There has been and error: ${error}`);
    }
  }
};

const NewCompany = () => {
  return <CompanyForm />;
};

export default NewCompany;
