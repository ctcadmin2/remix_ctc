import { Prisma } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import "dayjs/locale/ro";
import { redirectWithError } from "remix-toast";
import { pdf } from "remix-utils/responses";

import { db } from "~/utils/db.server";
import paymentsReportPDF from "~/utils/pdf/paymentsReportPDF.server";
import { authenticator, DEFAULT_REDIRECT } from "~/utils/session.server";

export type reportIndemnizations = Prisma.IndemnizationGetPayload<{
  include: {
    Payment: {
      include: {
        employee: {
          select: { firstName: true; lastName: true };
        };
      };
    };
  };
}>;

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const month = new URL(request.url).searchParams.get("month");

  if (month === null) {
    return redirectWithError("/employees", "Please specify a month.");
  }

  const indemnizations = await db.indemnization.findMany({
    where: {
      Payment: {
        month: {
          gte: dayjs(month).startOf("month").toDate().toISOString(),
          lte: dayjs(month).endOf("month").toDate().toISOString(),
        },
      },
    }, //TODO
    include: {
      Payment: {
        include: { employee: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  return pdf(
    await paymentsReportPDF(
      indemnizations,
      dayjs(month).locale("ro").format("MMMM YYYY")
    )
  );
}
