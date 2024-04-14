import { readFile } from "fs/promises";
import util from "util";

import dayjs from "dayjs";
import Decimal from "decimal.js";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

import { eInvoice } from "~/routes/efactura";

import { validate } from "./efactura.server";

export const xmlParser = async (invoice: eInvoice) => {
  if (invoice === null) {
    return null;
  }

  let xml = undefined;

  const vatAmount = new Decimal(invoice.amount)
    .times(invoice.vatRate)
    .dividedBy(100)
    .toString();

  invoice.client.vatValid ?? {
    ["cac:PartyTaxScheme"]: {
      ["cbc:CompanyID"]: `RO${invoice.client.vatNumber}`,
      ["cac:TaxScheme"]: { ["cbc:ID"]: "VAT" },
    },
  };

  try {
    const data = await readFile("template.xml");
    xml = new XMLParser().parse(data);
  } catch (error) {
    console.log("read: ", error);
  }

  xml.Invoice = {
    ...xml.Invoice,
    ["cbc:ID"]: `BCT${Intl.NumberFormat("ro-RO", {
      minimumIntegerDigits: 7,
      useGrouping: false,
    }).format(parseInt(invoice?.number))}`,
  };

  xml.Invoice = {
    ...xml.Invoice,
    ["cbc:IssueDate"]: dayjs(invoice.date).format("YYYY-MM-DD"),
  };

  console.log(invoice.client.address);

  // console.log(util.inspect(xml, false, null));

  // try {
  //   const data = new xml2js.Builder().buildObject(xml);

  // validate(data);
  // } catch (error) {
  //   console.log("write: ", error);
  //   return null;
  // }

  return null;
};
