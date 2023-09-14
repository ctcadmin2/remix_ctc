import { cwd } from "process";
import { mkdir, writeFileSync } from "fs";
import type { PDFImage } from "pdf-lib";
import { PDFDocument } from "pdf-lib";
import { createId } from '@paralleldrive/cuid2';
import { processAttachment } from "./attachment.server";

// A4 size in mm 210x297;
// in pixels 2480 x 3508 at 300dpi

const processImage = (img: PDFImage, pdfDoc: PDFDocument) => {
  let scaled = img.scaleToFit(2480, 3508);
  let page = pdfDoc.addPage([2480, 3508]);
  page.drawImage(img, {
    x: (2480 - scaled.width) / 2,
    y: (3508 - scaled.height) / 2,
    width: scaled.width,
    height: scaled.height,
  });
};

const FileUploader = async (
  files: Blob[],
  type: string,
  id: number
): Promise<void> => {
  try {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      let arrayBuffer = await file?.arrayBuffer();

      if (file.type !== "application/pdf") {
        if (file.type === "application/png") {
          let img = await pdfDoc.embedPng(arrayBuffer);
          processImage(img, pdfDoc);
        } else {
          let img = await pdfDoc.embedJpg(arrayBuffer);
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

    mkdir(`${cwd()}/storage/${type}/`, { recursive: true }, (err) => {
      if (err) throw err;
    });
    const name = `${createId()}.pdf`;
    const path = `/storage/${type}/${name}`;
    writeFileSync(`${cwd()}${path}`, await pdfDoc.save());

    await processAttachment(type, id, name);
  } catch (error) {
    console.log(error);
  }
};

export default FileUploader;
