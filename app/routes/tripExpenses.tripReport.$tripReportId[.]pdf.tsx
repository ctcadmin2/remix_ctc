import type { LoaderFunctionArgs } from "@remix-run/node";
import { jsonWithError } from "remix-toast";
import { zx } from "zodix";

import { db } from "~/utils/db.server";
import generateTripReportPDF from "~/utils/pdf/generateTripReportPDF.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { tripReportId } = zx.parseParams(params, {
    tripReportId: zx.NumAsString,
  });

  try {
    const tripReport = await db.tripReport.findUnique({
      where: { id: tripReportId },
      include: { expenses: { orderBy: { intNr: "asc" } } },
    });

    if (tripReport) {
      const pdf = await generateTripReportPDF(tripReport.expenses);

      return new Response(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    }
    return jsonWithError(null, "No trip expenses found.");
  } catch (error) {
    return jsonWithError(error, "There has been an error.");
  }
}
