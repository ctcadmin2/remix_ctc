import type { LoaderArgs } from "@remix-run/server-runtime";
import { readFile } from "fs/promises";

import { cwd } from "process";
import { pdf } from "remix-utils";
import { zx } from "zodix";
import { db } from "~/utils/db.server";

export async function loader({ params }: LoaderArgs) {
  const { documentId } = zx.parseParams(params, { documentId: zx.NumAsString });
  const document = await db.document.findUnique({
    where: { id: documentId },
    select: { attachment: { select: { type: true, name: true } } },
  });
  const attachment = document?.attachment;

  return pdf(
    await readFile(`${cwd()}/storage/${attachment?.type}/${attachment?.name}`)
  );
}
