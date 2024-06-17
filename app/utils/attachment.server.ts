import { unlink } from "node:fs";
import { readFile } from "node:fs/promises";

import type { Attachment } from "@prisma/client";

import { db } from "./db.server";

export const processAttachment = async (
  type:
    | "creditNote"
    | "internationalExpense"
    | "nationalExpense"
    | "tripExpense"
    | "document"
    | "eFactura",
  id: number | string,
  name: string,
) => {
  try {
    console.log("proc attach: ", type, id, name);
    const oldFile = await db.attachment.findFirst({
      where: { [`${type}Id`]: id },
    });

    if (oldFile) {
      console.log("old file");
      unlink(`/storage/${oldFile?.type}/${oldFile?.name}`, (err) => {
        if (err) {
          console.log("error on delete: ", err);
        }
      });
      await db.attachment.delete({ where: { id: oldFile.id } });
    }

    const attach = await db.attachment.create({
      data: {
        type,
        name,
        [`${type}`]: {
          connect: { id },
        },
      },
    });
    console.log("sega: ", attach);
  } catch (error) {
    console.log("processAttachment: ", error);
  }
};

export const getFile = async ({ type, name }: Partial<Attachment>) => {
  const path = `/storage/${type}/${name}`;

  return await readFile(path);
};
