import { mkdir, writeFile } from "node:fs/promises";
import { env } from "node:process";

import { createId } from "@paralleldrive/cuid2";
import { Company, Prisma } from "@prisma/client";
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import { stripPrefix } from "xml2js/lib/processors";

import { db } from "../db.server";
import { emitter } from "../emitter";
import findCompany from "../findCompany.server";

export interface message {
  data_creare: string;
  cif: string;
  id_solicitare: string;
  detalii: string;
  tip: "ERORI FACTURA" | "FACTURA PRIMITA" | "FACTURA TRIMISA";
  id: string;
}

interface receivedInvoiceType {
  number: string;
  vatNumber: string;
  date: Date;
  amount: string;
  supplier: Company | Prisma.CompanyCreateInput | null;
  pdf: Buffer | null;
}

export const processZip = async (
  zip: Buffer,
  downloadId: string,
  uploadId: string,
) => {
  const zipName = `${createId()}.zip`;
  const pdfName = `${createId()}.pdf`;
  try {
    const data = new AdmZip(zip);

    const xml = data.getEntry(`${uploadId}.xml`)?.getData();

    if (xml) {
      const invoice = await parseXml(xml);
      if (!invoice?.supplier) {
        return { status: "nok", message: "no supplier" };
      }

      //create new company if not already in db
      const newCompany = await companyCheck(invoice.supplier);

      if (newCompany?.status === "nok") {
        return newCompany;
      }

      // Check if expense already exists and update if
      const local = await db.nationalExpense.findFirst({
        where: {
          AND: [
            { number: { contains: invoice.number.slice(-2) } },
            { amount: { equals: invoice.amount } },
            { supplier: { vatNumber: { contains: invoice.vatNumber } } },
          ],
        },
        include: { EFactura: { select: { id: true } } },
      });
      if (local) {
        //if local invoice doesn't have efactura data add it
        if (!local.EFactura) {
          const newLocal = await db.nationalExpense.update({
            where: { id: local.id },
            data: {
              number: invoice.number,
              ...(invoice.pdf
                ? {
                    attachment: {
                      create: { type: "nationalExpense", name: pdfName },
                    },
                  }
                : {}),
              EFactura: {
                create: {
                  status: "store",
                  downloadId: downloadId,
                  attachment: {
                    create: {
                      type: "eFactura",
                      name: zipName,
                    },
                  },
                },
              },
            },
          });
          if (newLocal) {
            await mkdir(`/storage/eFactura/`, { recursive: true });
            await writeFile(`/storage/eFactura/${zipName}`, zip);
            if (invoice.pdf) {
              await mkdir(`/storage/nationalExpense/`, { recursive: true });
              await writeFile(
                `/storage/nationalExpense/${pdfName}`,
                invoice.pdf,
              );
            }
            return {
              status: "ok",
              message: `local invoice ${newLocal.number} was updated`,
            };
          }
          return {
            status: "nok",
            message: `local invoice ${invoice.number} could not be updated`,
          };
        }
        return {
          status: "nok",
          message: `invoice ${invoice.number} already exists`,
        };
      }

      //add new expense
      try {
        const ne = await db.nationalExpense.create({
          data: {
            amount: invoice.amount,
            date: new Date(invoice.date),
            number: invoice.number,
            supplier: {
              connect: {
                id:
                  "id" in invoice.supplier
                    ? invoice.supplier.id
                    : newCompany.data?.id,
              },
            },
            ...(invoice.pdf
              ? {
                  attachment: {
                    create: { type: "nationalExpense", name: pdfName },
                  },
                }
              : {}),
            EFactura: {
              create: {
                status: "store",
                downloadId,
                attachment: { create: { type: "eFactura", name: zipName } },
              },
            },
          },
        });
        if (ne) {
          await mkdir(`/storage/eFactura/`, { recursive: true });
          await writeFile(`/storage/eFactura/${zipName}`, zip);
          if (invoice.pdf) {
            await mkdir(`/storage/nationalExpense/`, { recursive: true });
            await writeFile(`/storage/nationalExpense/${pdfName}`, invoice.pdf);
          }
          return {
            status: "ok",
            message: `new invoice ${ne.number} was created`,
          };
        }
        return {
          status: "nok",
          message: `new invoice ${invoice.number} could not be created`,
        };
      } catch (error) {
        return {
          status: "nok",
          message: `error while creating invoice ${invoice.number} with error: ${error}`,
        };
      }
    }
    return { status: "nok", message: "no data in xml" };
  } catch (error) {
    return {
      status: "nok",
      message: `Something went wrong in unzip: ${error}`,
    };
  }
};

export const processMessages = async (mesaje: message[]) => {
  mesaje.map(async (m) => {
    const data = await messageDownloader(m.id);
    if (data) {
      const response = await processZip(
        Buffer.from(await data.arrayBuffer()),
        m.id,
        m.id_solicitare,
      );
      try {
        const message = await db.message.create({
          data: { status: response.status, content: response.message },
        });
        if (message) {
          emitter.emit("messages");
        }
      } catch (error) {
        console.log(`There was an error while creating message: ${error}`);
      }
    }
  });
};

//TODO dry
const messageDownloader = async (downloadId: string) => {
  const url = `https://api.anaf.ro/prod/FCTEL/rest/descarcare?id=${downloadId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.TOKEN}` },
    });

    if (response.status === 200) {
      if (response.headers.get("content-type") === "application/zip") {
        return await response.blob();
      }
      console.log("downloader error: ", await response.json());
      return null;
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const parseXml = async (xml: Buffer) => {
  const invoice: receivedInvoiceType = {
    number: "",
    vatNumber: "",
    date: new Date(),
    amount: "",
    supplier: null,
    pdf: null,
  };

  try {
    const data = await parseStringPromise(xml, {
      trim: true,
      explicitArray: false,
      ignoreAttrs: true,
      tagNameProcessors: [stripPrefix],
    });
    const pdf =
      data.Invoice.AdditionalDocumentReference?.Attachment
        .EmbeddedDocumentBinaryObject;
    const vatNumber =
      data.Invoice.AccountingSupplierParty.Party.PartyTaxScheme.CompanyID.split(
        /(\d+)/,
      )
        .filter(Boolean)
        .filter(Number)[0];

    invoice.number = data.Invoice.ID;
    invoice.date = data.Invoice.IssueDate;
    invoice.amount = data.Invoice.LegalMonetaryTotal.TaxInclusiveAmount;
    invoice.vatNumber = vatNumber;
    invoice.supplier = (await findCompany("RO", vatNumber)).data;
    invoice.pdf = pdf && Buffer.from(pdf, "base64");
    return invoice;
  } catch (error) {
    await db.message.create({
      data: {
        status: "nok",
        content: `There was and error while parsing xml: ${error}`,
      },
    });
    return null;
  }
};

const companyCheck = async (supplier: Company | Prisma.CompanyCreateInput) => {
  if (!Object.hasOwn(supplier, "id")) {
    try {
      const data = await db.company.create({
        data: { ...supplier },
      });
      if (data) {
        await db.message.create({
          data: {
            status: "ok",
            content: `New company ${data.name} added.`,
          },
        });
        return { status: "ok", message: "", data };
      }
      return {
        status: "nok",
        message: `company ${supplier.name} could not be created`,
      };
    } catch (error) {
      return {
        status: "nok",
        message: `error while creating company ${supplier.name} with error: ${error}`,
      };
    }
  }
  return { status: "ok", message: "company exists" };
};
