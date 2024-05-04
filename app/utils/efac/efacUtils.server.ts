import { mkdir, writeFile } from "node:fs/promises";

import { createId } from "@paralleldrive/cuid2";
import { Company } from "@prisma/client";
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import { stripPrefix } from "xml2js/lib/processors";

import { db } from "../db.server";

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
  supplier?: {
    id?: number;
    name: string;
    address: string | null;
    county: string | null;
    vatNumber: string;
    vatValid: boolean | null;
  } | null;
  pdf?: Buffer;
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
      let newCompany: Company | undefined = undefined;
      if (!invoice.supplier.id) {
        try {
          const data = await db.company.create({
            data: { country: "RO", ...invoice.supplier },
          });
          if (data) {
            newCompany = data;
          }
          return {
            status: "nok",
            message: `company ${invoice.supplier.name} could not be created`,
          };
        } catch (error) {
          return {
            status: "nok",
            message: `error while creating company ${invoice.supplier.name} with error: ${error}`,
          };
        }
      }

      // Check if expense already exists and update if
      const local = await db.nationalExpense.findFirst({
        where: {
          AND: [
            { number: { contains: invoice.number.slice(-2) } },
            { amount: { equals: invoice.amount } },
          ],
        },
        include: { EFactura: { select: { id: true } } },
      });
      if (local) {
        if (!local.EFactura) {
          const newLocal = await db.nationalExpense.update({
            where: { id: local.id },
            data: {
              number: invoice.number,
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
            await mkdir(`storage/eFactura/`, { recursive: true });
            await writeFile(`storage/eFactura/${zipName}`, zip);
            if (invoice.pdf) {
              await mkdir(`storage/nationalExpense/`, { recursive: true });
              await writeFile(
                `storage/nationalExpense/${pdfName}`,
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
              connect: { id: invoice.supplier.id ?? newCompany?.id },
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
                downloadId: downloadId,
                attachment: { create: { type: "eFactura", name: zipName } },
              },
            },
          },
        });
        if (ne) {
          await mkdir(`storage/eFactura/`, { recursive: true });
          await writeFile(`storage/eFactura/${zipName}`, zip);
          if (invoice.pdf) {
            await mkdir(`storage/nationalExpense/`, { recursive: true });
            await writeFile(`storage/nationalExpense/${pdfName}`, invoice.pdf);
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

export const parseXml = async (xml: Buffer) => {
  const invoice: receivedInvoiceType = {
    number: "",
    vatNumber: "",
    date: new Date(),
    amount: "",
  };

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

  const findCompany = await db.company.findMany({
    where: { vatNumber: { contains: vatNumber } },
  });

  let company: receivedInvoiceType["supplier"] = null;

  if (findCompany.length === 0) {
    company = {
      vatNumber,
      vatValid: data.Invoice.AccountingSupplierParty.Party.PartyTaxScheme
        .TaxScheme.ID
        ? true
        : false,
      address: `${data.Invoice.AccountingSupplierParty.Party.PostalAddress.StreetName}, ${data.Invoice.AccountingSupplierParty.Party.PostalAddress.CityName}`,
      county:
        data.Invoice.AccountingSupplierParty.Party.PostalAddress
          .CountrySubentity,
      name: data.Invoice.AccountingSupplierParty.Party.PartyName.Name,
    };
  } else if (findCompany.length === 1) {
    company = findCompany[0];
  } else {
    company = null;
  }

  invoice.number = data.Invoice.ID;
  invoice.date = data.Invoice.IssueDate;
  invoice.amount = data.Invoice.LegalMonetaryTotal.TaxInclusiveAmount;
  invoice.vatNumber = vatNumber;
  invoice.supplier = company;
  invoice.pdf = pdf && Buffer.from(pdf, "base64");

  return invoice;
};
