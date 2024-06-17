import { mkdir } from "node:fs";
import { writeFile } from "node:fs/promises";

import { createId } from "@paralleldrive/cuid2";
import type { PDFImage } from "pdf-lib";
import { PDFDocument } from "pdf-lib";

import { processAttachment } from "./attachment.server";

// A4 size in mm 210x297;
// in pixels 2480 x 3508 at 300dpi

const genPDF = async (files: Blob[]) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file?.arrayBuffer();

    if (file.type !== "application/pdf") {
      if (file.type === "application/png") {
        const img = await pdfDoc.embedPng(arrayBuffer);
        processImage(img, pdfDoc);
      } else {
        const img = await pdfDoc.embedJpg(arrayBuffer);
        processImage(img, pdfDoc);
      }
    } else {
      const inputPdf = await PDFDocument.load(arrayBuffer);

      const pageIndices = inputPdf.getPageIndices();
      const copiedPages = await pdfDoc.copyPages(inputPdf, pageIndices);

      for (const page of copiedPages) {
        pdfDoc.addPage(page);
      }
    }
  }

  return await pdfDoc.save();
};

const processImage = (img: PDFImage, pdfDoc: PDFDocument) => {
  const scaled = img.scaleToFit(2480, 3508);
  const page = pdfDoc.addPage([2480, 3508]);
  page.drawImage(img, {
    x: (2480 - scaled.width) / 2,
    y: (3508 - scaled.height) / 2,
    width: scaled.width,
    height: scaled.height,
  });
};

const FileUploader = async (
  files: Blob[],
  type:
    | "creditNote"
    | "internationalExpense"
    | "nationalExpense"
    | "tripExpense"
    | "document"
    | "eFactura",
  id: number | string,
): Promise<void> => {
  console.log("upl");
  mkdir(`/storage/${type}/`, { recursive: true }, (err) => {
    if (err) throw err;
  });

  let pdf = undefined;

  if (type !== "eFactura") {
    pdf = await genPDF(files);
  }

  try {
    const name = `${createId()}.${pdf ? "pdf" : "zip"}`;
    const path = `/storage/${type}/${name}`;

    const data = pdf ? pdf : Buffer.from(await files[0].arrayBuffer());
    await writeFile(`${path}`, data);

    await processAttachment(type, id, name);
  } catch (error) {
    console.error(error);
  }
};

export default FileUploader;
