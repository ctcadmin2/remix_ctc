import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { pdf } from "remix-utils/responses";

import { db } from "~/utils/db.server";
import generateDelegationPDF from "~/utils/pdf/generateDelegationPDF.server";
import { authenticator, DEFAULT_REDIRECT } from "~/utils/session.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const indemnization = await db.indemnization.findUnique({
    where: { id: params.id },
    include: {
      Payment: {
        include: { employee: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  return pdf(await generateDelegationPDF(indemnization));
}
