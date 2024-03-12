import {
  ActionFunction,
  LoaderFunction,
  LoaderFunctionArgs,
  json,
} from "@remix-run/server-runtime";
import { jsonWithError, redirectWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { zfd } from "zod-form-data";

import EmployeeForm from "~/forms/EmployeeForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  firstName: zfd.text(),
  lastName: zfd.text(),
  ssn: zfd.text(),
  activ: zfd.checkbox(),
});

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

  const data = schema.parse(await request.formData());

  try {
    const employee = await db.employee.create({
      data,
    });
    if (employee) {
      return redirectWithSuccess(
        "/employees",
        "Employee created successfully.",
      );
    } else {
      return jsonWithError(null, "Employee could not be created.");
    }
  } catch (error) {
    return jsonWithError(null, `There has been and error: ${error}`);
  }
};

const NewCompany = () => {
  return <EmployeeForm />;
};

export default NewCompany;
