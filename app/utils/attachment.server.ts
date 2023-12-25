import { readFileSync, unlink } from "fs";
import { cwd } from "process";

import type { Attachment } from "@prisma/client";

import { db } from "./db.server";

export const processAttachment = async (
  type: string,
  id: number,
  name: string
) => {
  try {
    const oldFile = await db.attachment.findUnique({
      where: { [`${type}Id`]: id },
    });

    if (oldFile) {
      unlink(`${cwd()}/storage/${oldFile?.type}/${oldFile?.name}`, (err) => {
        if (err) {
          console.log("error on delete: ", err);
        }
      });
      await db.attachment.delete({ where: { id: oldFile?.id } });
    }

    await db.attachment.create({
      data: {
        type,
        name,
        [`${type}`]: {
          connect: { id },
        },
      },
    });
  } catch (error) {
    console.log("processAttachment: ", error);
  }
};

export const getPdf = async ({ type, name }: Attachment) => {
  const path = `${cwd()}/storage/${type}/${name}`;

  return readFileSync(path);
};
