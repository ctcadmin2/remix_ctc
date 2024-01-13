import { User } from "@prisma/client";
import Decimal from "decimal.js";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";

import { InvoiceData, CompanyInfo } from "~/routes/invoices.$id[.]pdf";

interface CompanyData {
  name: string;
  registration: string;
  vat: string;
  address: string;
  accRon: string;
  accEur: string;
  bank: string;
  capital: string;
  phone: string;
  contact: string;
  email: string;
}

const fonts = {
  Roboto: {
    normal: "app/utils/pdf/fonts/Roboto/Roboto-Regular.ttf",
    bold: "app/utils/pdf/fonts/Roboto/Roboto-Bold.ttf",
  },
};

const notFoundDef: TDocumentDefinitions = {
  pageSize: "A4",
  pageMargins: 20,
  content: [{ text: "Invoice data not found.", alignment: "center" }],
};

const generateInvoicePDF = async (
  invoice: InvoiceData["invoice"] | null,
  company: CompanyInfo[],
  user: Partial<User>
) => {
  const doc = new PdfPrinter(fonts);

  if (invoice === null) {
    const pdfDoc = doc.createPdfKitDocument(notFoundDef);

    pdfDoc.end();

    const buff: Buffer[] = [];

    for await (const chunk of pdfDoc) {
      buff.push(chunk as Buffer);
    }

    return Buffer.concat(buff);
  }

  const companyData: CompanyData = Object.assign(
    {},
    ...company.map((obj) => {
      return { [obj.name]: obj.value[0] };
    })
  );

  const cnLines = () => {
    const lines: TableCell[][] = [
      [
        {
          text: "Transport conform contract:",
          colSpan: 5,
          border: [true, false, true, false],
        },
      ],
    ];

    invoice.creditNotes.map((cn) => {
      const value = invoice.bnr
        ? new Decimal(cn.amount).times(new Decimal(invoice.bnr)).toNumber()
        : new Decimal(cn.amount).toNumber();
      const currency = invoice.bnr ? invoice.currency : cn.currency;

      lines.push([
        { text: `${cn.number}`, border: [true, false, false, false] },
        {
          text: "1",
          border: [false, false, false, false],
          alignment: "center",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: currency,
          }).format(value)}`,
          border: [false, false, false, false],
          alignment: "right",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: currency,
          }).format(value)}`,
          border: [false, false, false, false],
          alignment: "right",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: currency,
          }).format(
            new Decimal(value).times(invoice.vatRate).dividedBy(100).toNumber()
          )}`,
          border: [false, false, true, false],
          alignment: "right",
        },
      ]);
    });
    const length = 21 - lines.length;

    for (let index = 0; index <= length; index++) {
      lines.push([
        { text: " ", colSpan: 5, border: [true, false, true, false] },
      ]);
    }

    return lines;
  };

  const orderLines = () => {
    const lines: TableCell[][] = [];
    let extra = 0;

    invoice.orders.map((order) => {
      if (order.description.length >= 30) {
        extra = new Decimal(order.description.length)
          .dividedBy(30)
          .floor()
          .add(extra)
          .toNumber();
      }

      lines.push([
        {
          text: `${order.description}`,
          border: [true, false, false, false],
          alignment: "justify",
        },
        {
          text: `${order.quantity}`,
          border: [false, false, false, false],
          alignment: "center",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: invoice.currency,
          }).format(new Decimal(order.amount).toNumber())}`,
          border: [false, false, false, false],
          alignment: "right",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: invoice.currency,
          }).format(new Decimal(order.total).toNumber())}`,
          border: [false, false, false, false],
          alignment: "right",
        },
        {
          text: `${new Intl.NumberFormat("ro-RO", {
            style: "currency",
            currency: invoice.currency,
          }).format(
            new Decimal(order.total)
              .times(invoice.vatRate)
              .dividedBy(100)
              .toNumber()
          )}`,
          border: [false, false, true, false],
          alignment: "right",
        },
      ]);
    });

    const length = 21 - lines.length - extra;

    for (let index = 0; index <= length; index++) {
      lines.push([
        { text: " ", colSpan: 5, border: [true, false, true, false] },
      ]);
    }

    return lines;
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: 20,
    content: [
      {
        table: {
          widths: ["45%", "15%", "40%"],

          body: [
            [
              {
                text: `Furnizor: ${companyData.name}`,
                border: [true, true, false, false],
                bold: true,
              },
              { text: "", border: [false, true, false, false] },
              {
                text: "FACTURA",
                bold: true,
                alignment: "center",
                border: [false, true, true, false],
              },
            ],
            [
              {
                text: `Nr.ord.Reg.Com/an: ${companyData.registration}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `Seria NT ${
                  invoice?.client.country === "RO" ? "BCT" : "ACT"
                } Nr. ${new Intl.NumberFormat("ro-RO", {
                  minimumIntegerDigits: 7,
                  useGrouping: false,
                }).format(invoice?.number)}`,
                border: [false, false, true, false],
                alignment: "center",
                bold: true,
              },
            ],
            [
              {
                text: `C.U.I. ${companyData.vat}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `Din data de ${Intl.DateTimeFormat("ro-RO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(Date.parse(String(invoice.date)))}`,
                alignment: "center",
                border: [false, false, true, false],
              },
            ],
            [
              {
                text: `Adresa: ${companyData.address}`,
                rowSpan: 2,
                border: [true, false, false, false],
              },
              { text: "", rowSpan: 2, border: [false, false, false, false] },
              {
                text: `Cumparator: ${invoice.client.name}`,
                alignment: "justify",
                bold: true,
                rowSpan: 2,
                border: [false, false, true, false],
              },
            ],
            [
              { text: " ", border: [true, false, false, false] },
              { text: " ", border: [false, false, false, false] },
              { text: " ", border: [false, false, true, false] },
            ],
            [
              {
                text: `Cont Lei: ${companyData.accRon}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `Nr ord Reg.Com/an: ${invoice.client.registration ?? ""}`,
                alignment: "justify",
                border: [false, false, true, false],
              },
            ],
            [
              {
                text: `Cont EUR: ${companyData.accEur}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `C.U.I: ${invoice.client.vatNumber}`,
                alignment: "justify",
                border: [false, false, true, false],
              },
            ],
            [
              {
                text: `Banca: ${companyData.bank}`,
                border: [true, false, false, false],
              },
              { text: " ", border: [false, false, false, false] },
              {
                text: `Adresa: ${invoice.client.address ?? ""}`,
                alignment: "justify",
                rowSpan: 2,
                border: [false, false, true, false],
              },
            ],
            [
              {
                text: `Tel: ${companyData.phone}`,
                border: [true, false, false, false],
              },
              { text: " ", border: [false, false, false, false] },
              { text: " ", border: [false, false, true, false] },
            ],
            [
              {
                text: `Capital: ${companyData.capital}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `Banca: ${invoice.client.bank || ""}`,
                alignment: "justify",
                border: [false, false, true, false],
              },
            ],
            [
              {
                text: `Cota TVA: ${vatRate(invoice)}`,
                border: [true, false, false, false],
              },
              { text: "", border: [false, false, false, false] },
              {
                text: `Cont: ${
                  invoice.client.country === "RO"
                    ? invoice.client.accRon || ""
                    : invoice.client.accEur || ""
                }`,
                alignment: "justify",
                border: [false, false, true, false],
              },
            ],
          ],
        },
      },
      {
        table: {
          widths: ["*", 30, 92, 92, 92],
          headerRows: 1,
          body: [
            [
              { text: "Denumire servicii sau produs" },
              { text: "Cant", alignment: "center" },
              { text: "Pret unitar", alignment: "center" },
              { text: "Valoare", alignment: "center" },
              { text: "Valoare TVA", alignment: "center" },
            ],
            ...(invoice.creditNotes.length > 0 ? cnLines() : orderLines()),
          ],
        },
      },
      {
        table: {
          widths: ["40%", "30%", "30%"],
          body: [
            [
              {
                layout: "noBorders",
                table: {
                  widths: ["auto", "*"],
                  body: [
                    [
                      {
                        text: "Intocmit de: ",
                      },
                      {
                        text: `${user?.firstName} ${user?.lastName}`,
                        alignment: "right",
                      },
                    ],
                    [
                      { text: invoice.bnr ? "Curs BNR: " : " " },
                      {
                        text: invoice.bnrAt
                          ? `${invoice.bnr}/${new Intl.DateTimeFormat(
                              "ro-RO"
                            ).format(invoice.bnrAt)}`
                          : " ",
                        alignment: "right",
                      },
                    ],
                  ],
                },
              },
              {
                layout: "noBorders",
                table: {
                  widths: ["auto", "*"],
                  body: [
                    [
                      {
                        text: "Total Net: ",
                        bold: true,
                      },
                      {
                        text: `${new Intl.NumberFormat("ro-RO", {
                          style: "currency",
                          currency: invoice.currency,
                        }).format(new Decimal(invoice.amount).toNumber())}`,
                        bold: true,
                        alignment: "right",
                      },
                    ],
                    [
                      { text: " " },
                      {
                        text: invoice.bnr
                          ? `${new Intl.NumberFormat("ro-RO", {
                              style: "currency",
                              currency: "EUR",
                            }).format(
                              new Decimal(invoice.amount)
                                .dividedBy(new Decimal(invoice.bnr))
                                .toNumber()
                            )}`
                          : " ",
                        alignment: "right",
                      },
                    ],
                  ],
                },
              },
              {
                layout: "noBorders",
                table: {
                  widths: ["auto", "*"],
                  body: [
                    [
                      {
                        text: "Total TVA:",
                        bold: true,
                      },
                      {
                        text: `${new Intl.NumberFormat("ro-RO", {
                          style: "currency",
                          currency: invoice.currency,
                        }).format(
                          new Decimal(invoice.amount)
                            .times(invoice.vatRate)
                            .dividedBy(100)
                            .toNumber()
                        )}`,
                        bold: true,
                        alignment: "right",
                      },
                    ],
                    [
                      { text: " " },
                      {
                        text: invoice.bnr
                          ? `${new Intl.NumberFormat("ro-RO", {
                              style: "currency",
                              currency: "EUR",
                            }).format(
                              new Decimal(invoice.amount)
                                .times(invoice.vatRate)
                                .dividedBy(100)
                                .dividedBy(new Decimal(invoice.bnr))
                                .toNumber()
                            )}`
                          : " ",
                        alignment: "right",
                      },
                    ],
                  ],
                },
              },
            ],
          ],
        },
      },
      {
        table: {
          widths: ["25%", "45%", "30%"],
          body: [
            [
              {
                text: "Semnatura si stampila",
                rowSpan: 5,
                alignment: "justify",
              },
              {
                text: "Date privind expeditia",
                alignment: "center",
                border: [true, true, false, true],
              },
              { text: " ", border: [false, true, true, true] },
            ],
            [
              {},
              {
                columns: [
                  {
                    width: "auto",
                    text: "Nume delegat:",
                  },
                  {
                    width: "*",
                    text: `${invoice.identification?.expName ?? ""}`,
                    alignment: "right",
                  },
                ],
                border: [true, true, false, true],
              },
              { text: " ", border: [false, true, true, true] },
            ],
            [
              {},
              {
                columns: [
                  {
                    width: "auto",
                    text: "Act identitate:",
                  },
                  {
                    width: "*",
                    text: `${invoice.identification?.expId ?? ""}`,
                    alignment: "right",
                  },
                ],
                border: [true, true, false, true],
              },
              { text: " ", border: [false, true, true, true] },
            ],
            [
              {},
              {
                columns: [
                  {
                    width: "auto",
                    text: "Mijloc de transport: ",
                  },
                  {
                    width: "*",
                    text: `${invoice.identification?.expVeh ?? ""}`,
                    alignment: "right",
                  },
                ],
              },
              {
                columns: [
                  { text: "Total factura:", bold: true },
                  {
                    text: `${new Intl.NumberFormat("ro-RO", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(
                      new Decimal(invoice.amount)
                        .times(
                          new Decimal(invoice.vatRate).dividedBy(100).add(1)
                        )
                        .toNumber()
                    )}`,
                    bold: true,
                    alignment: "right",
                  },
                ],
                border: [true, true, true, false],
              },
            ],
            [
              {},
              {
                columns: [
                  {
                    width: "auto",
                    text: "Semnatura: ",
                  },
                  {
                    width: "*",
                    text: " ",
                  },
                ],
              },
              {
                columns: [
                  { text: " " },
                  {
                    text: invoice.bnr
                      ? `${new Intl.NumberFormat("ro-RO", {
                          style: "currency",
                          currency: "EUR",
                        }).format(
                          new Decimal(invoice.amount)
                            .times(
                              new Decimal(invoice.vatRate).dividedBy(100).add(1)
                            )
                            .dividedBy(new Decimal(invoice.bnr))
                            .toNumber()
                        )}`
                      : "",
                    alignment: "right",
                  },
                ],
                border: [true, false, true, true],
              },
            ],
          ],
        },
      },
    ],
    defaultStyle: {
      fontSize: 12,
    },
  };

  const pdfDoc = doc.createPdfKitDocument(docDefinition);

  pdfDoc.end();

  const buff: Buffer[] = [];

  for await (const chunk of pdfDoc) {
    buff.push(chunk as Buffer);
  }

  return Buffer.concat(buff);
};

export default generateInvoicePDF;

const vatRate = (invoice: InvoiceData["invoice"]) => {
  if (invoice.client.country !== "RO" && invoice.vatRate === 0) {
    return "taxare inversa";
  }

  return `${String(invoice.vatRate)}%`;
};
