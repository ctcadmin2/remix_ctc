import type { Attachment } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { zx } from "zodix";

import { getFile } from "~/utils/attachment.server";
import { db } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { creditNoteId } = zx.parseParams(params, {
    creditNoteId: zx.NumAsString,
  });
  const attachement = await db.attachment.findUnique({
    where: { creditNoteId },
  });
  const pdf = await getFile(attachement as Attachment);

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
