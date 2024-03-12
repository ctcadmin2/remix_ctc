import type { LoaderFunctionArgs } from "@remix-run/node";
import { jsonWithError } from "remix-toast";
import { zx } from "zodix";

import { getPdf } from "~/utils/attachment.server";
import { db } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { creditNoteId } = zx.parseParams(params, {
    creditNoteId: zx.NumAsString,
  });

  try {
    const attachement = await db.attachment.findUnique({
      where: { creditNoteId },
    });

    if (attachement) {
      const pdf = await getPdf(attachement);

      return new Response(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    }
    return jsonWithError(null, "No attachement found.");
  } catch (error) {
    return jsonWithError(error, "There has been an error.");
  }
}
