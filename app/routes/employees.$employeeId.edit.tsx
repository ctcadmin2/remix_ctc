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
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import EmployeeForm from "~/forms/EmployeeForm";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

const schema = zfd.formData({
  firstName: zfd.text(),
  lastName: zfd.text(),
  ssn: zfd.text(),
  active: zfd.checkbox(),
});

export const loader: LoaderFunction = async ({
  request,
  params,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { employeeId } = zx.parseParams(params, {
    employeeId: zx.NumAsString,
  });

  const employee = await db.employee.findUnique({
    where: { id: employeeId },
  });

  return json(employee);
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

  const { employeeId } = zx.parseParams(params, {
    employeeId: zx.NumAsString,
  });

  const data = schema.parse(await request.formData());

  try {
    const employee = await db.employee.update({
      where: { id: employeeId },
      data,
    });
    if (employee) {
      return redirectWithSuccess(
        "/employees",
        "Employee updated successfully.",
      );
    }
    return jsonWithError(null, "Employee could not be updated.");
  } catch (error) {
    return jsonWithError(error, `There has been and error: ${error}`);
  }
};

export default function EditEmployee() {
  const employee = useLoaderData<typeof loader>();
  return <EmployeeForm employee={employee} />;
}
