import { Company } from "@prisma/client";
import { ShouldRevalidateFunction } from "@remix-run/react";
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
import { zfd } from "zod-form-data";

import CompanyForm from "~/forms/CompanyForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import findCompany from "~/utils/findCompany.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  _action: zfd.text(),
  name: zfd.text(),
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

  const { _action, ...rest } = schema.parse(await request.formData());

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
        return jsonWithError(data.data, "OpenAPI servive unavailable.");
      default:
        return jsonWithError(data.data, "An error has occured.");
    }
  } else {
    try {
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
    } catch (error) {
      return jsonWithError(null, `There has been and error: ${error}`);
    }
  }
};

export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return true;
};

const NewCompany = () => {
  return <CompanyForm />;
};

export default NewCompany;
