import type { Attachment } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { zx } from "zodix";
import { getPdf } from "~/utils/attachment.server";
import { db } from "~/utils/db.server";

export async function loader({ params }: LoaderArgs) {
  const { creditNoteId } = zx.parseParams(params, {
    creditNoteId: zx.NumAsString,
  });
  const attachement = await db.attachment.findUnique({
    where: { creditNoteId },
  });
  const pdf = await getPdf(attachement as Attachment);

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
    },
  });
}
