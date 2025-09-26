import { readFile } from "node:fs/promises";

import type { LoaderFunctionArgs } from "@remix-run/server-runtime";
import { pdf } from "remix-utils/responses";
import { zx } from "zodix";

import { db } from "~/utils/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { documentId } = zx.parseParams(params, { documentId: zx.NumAsString });
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { attachment: { select: { type: true, name: true } } },
  });
  const attachment = document?.attachment;

  return pdf(
    await readFile(`/storage/${attachment?.type}/${attachment?.name}`)
  );
}
