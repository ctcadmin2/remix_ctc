import dayjs from "dayjs";
import Decimal from "decimal.js";
import { Invoice } from "ubl-builder";
import {
  AccountingSupplierParty,
  Party,
  PostalAddress,
  Country,
  PartyLegalEntity,
  PartyTaxScheme,
  TaxScheme,
  AccountingCustomerParty,
  TaxSubtotal,
  TaxCategory,
  Item,
  ClassifiedTaxCategory,
  Price,
} from "ubl-builder/lib/ubl21/CommonAggregateComponents";
import { PayeeFinancialAccount } from "ubl-builder/lib/ubl21/CommonAggregateComponents/PayeeFinancialAccount";
import {
  UdtAmount,
  UdtQuantity,
} from "ubl-builder/lib/ubl21/types/UnqualifiedDataTypes";

import { eInvoice } from "~/routes/efactura";

import { db } from "./db.server";

Decimal.set({ precision: 8, rounding: 4 });

const account = await db.setting.findFirst({ where: { name: "accRon" } });

const XMLBuilder = async (invoice: eInvoice) => {
  if (invoice === null) {
    return null;
  }

  const id = `BCT${Intl.NumberFormat("ro-RO", {
    minimumIntegerDigits: 7,
    useGrouping: false,
  })
    .format(parseInt(invoice.number))
    .toString()}`;

  const vatAmount = new Decimal(invoice.amount)
    .times(invoice.vatRate)
    .dividedBy(100)
    .toDP(2)
    .toString();

  const xml = new Invoice(id, {
    issuer: {
      endDate: "",
      endRange: "",
      prefix: "",
      resolutionNumber: "",
      startDate: "",
      startRange: "",
      technicalKey: "",
    },
    software: { id: "", pin: "", providerNit: "" },
  });
  xml.addProperty(
    "xmlns",
    "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  );
  xml.addProperty(
    "xmlns:cbc",
    "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  );
  xml.addProperty(
    "xmlns:cac",
    "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  );
  xml.addProperty(
    "xmlns:ns4",
    "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
  );
  xml.addProperty("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");

  xml.addProperty(
    "xsi:schemaLocation",
    "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 http://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd",
  );

  xml.setCustomizationID(
    "urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1",
  );
  xml.setID(id);
  xml.setIssueDate(dayjs(invoice.date).format("YYYY-MM-DD"));
  xml.setInvoiceTypeCode("380");
  xml.setDocumentCurrencyCode("RON");
  xml.setAccountingSupplierParty(
    new AccountingSupplierParty({
      party: new Party({
        postalAddress: new PostalAddress({
          streetName: "Plantelor 35",
          cityName: "Dumbrava Rosie",
          countrySubentity: "RO-NT",
          country: new Country({ identificationCode: "RO" }),
        }),
        partyLegalEntities: [
          new PartyLegalEntity({
            registrationName: "COZMA TRANSPORT 2005 S.R.L.",
          }),
        ],
        partyTaxSchemes: [
          new PartyTaxScheme({
            companyID: "RO17868720",
            taxScheme: new TaxScheme({ id: "VAT" }),
          }),
        ],
      }),
    }),
  );
  xml.setAccountingCustomerParty(
    new AccountingCustomerParty({
      party: new Party({
        postalAddress: new PostalAddress({
          streetName: `${invoice.client.address?.split(", ").slice(0, -1).join(", ")}`,
          cityName: `${invoice.client.address?.split(", ").pop()?.split(" ").join("")}`,
          countrySubentity: `${invoice.client.county}`,
          country: new Country({ identificationCode: "RO" }),
        }),
        partyLegalEntities: [
          new PartyLegalEntity({
            registrationName: invoice.client.name,
          }),
        ],
        partyTaxSchemes: [
          new PartyTaxScheme({
            companyID: `RO${invoice.client.vatNumber}`,
            taxScheme: new TaxScheme({ id: "VAT" }),
          }),
        ],
      }),
    }),
  );
  xml.addPaymentMeans({
    paymentMeansCode: "42",
    payeeFinancialAccount: new PayeeFinancialAccount({
      id: `${account?.value[0]}`,
    }),
  });
  xml.addPaymentTerm({ note: `${invoice.paymentTerms}` });
  xml.addTaxTotal({
    taxAmount: new UdtAmount(vatAmount, { currencyID: "RON" }),
    taxSubtotals: [
      new TaxSubtotal({
        taxableAmount: new UdtAmount(String(invoice.amount), {
          currencyID: "RON",
        }),
        taxAmount: new UdtAmount(vatAmount, { currencyID: "RON" }),
        taxCategory: new TaxCategory({
          id: "S",
          percent: "19.00",
          taxScheme: new TaxScheme({ id: "VAT" }),
        }),
      }),
    ],
  });
  xml.setLegalMonetaryTotal({
    lineExtensionAmount: new UdtAmount(String(invoice.amount), {
      currencyID: "RON",
    }),
    taxExclusiveAmount: new UdtAmount(String(invoice.amount), {
      currencyID: "RON",
    }),
    taxInclusiveAmount: new UdtAmount(
      new Decimal(invoice.amount).plus(vatAmount).toString(),
      {
        currencyID: "RON",
      },
    ),
    payableAmount: new UdtAmount(
      new Decimal(invoice.amount).plus(vatAmount).toString(),
      {
        currencyID: "RON",
      },
    ),
  });
  invoice.orders.map((o, i: number) => {
    xml.addInvoiceLine({
      id: `${i + 1}`,
      invoicedQuantity: new UdtQuantity(`${o.quantity}`, { unitCode: "H87" }),
      lineExtensionAmount: new UdtAmount(String(o.amount), {
        currencyID: "RON",
      }),
      item: new Item({
        name: `${o.description}`,
        classifiedTaxCategory: new ClassifiedTaxCategory({
          id: "S",
          percent: `${invoice.vatRate}.00`,
          taxScheme: new TaxScheme({ id: "VAT" }),
        }),
      }),
      price: new Price({
        priceAmount: new UdtAmount(String(o.total), {
          currencyID: "RON",
        }),
      }),
    });
  });

  invoice.creditNotes.map((cn, i) => {
    xml.addInvoiceLine({
      id: `${i + 1}`,
      invoicedQuantity: new UdtQuantity("1", { unitCode: "H87" }),
      lineExtensionAmount: new UdtAmount(String(cn.amount), {
        currencyID: "RON",
      }),
      item: new Item({
        name: `transport conform contract ${cn.number}`,
        classifiedTaxCategory: new ClassifiedTaxCategory({
          id: "S",
          percent: `${invoice.vatRate}.00`,
          taxScheme: new TaxScheme({ id: "VAT" }),
        }),
      }),
      price: new Price({
        priceAmount: new UdtAmount(String(cn.amount), {
          currencyID: "RON",
        }),
      }),
    });
  });

  return xml.getXml(true);
};

export default XMLBuilder;
