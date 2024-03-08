import { TripExpense } from "@prisma/client";
import dayjs from "dayjs";
import "dayjs/locale/ro";
import Decimal from "decimal.js";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";

const fonts = {
  Roboto: {
    normal: "app/utils/pdf/fonts/Roboto/Roboto-Regular.ttf",
    bold: "app/utils/pdf/fonts/Roboto/Roboto-Bold.ttf",
  },
};

const generateTripReportPDF = async (expenses: TripExpense[]) => {
  const doc = new PdfPrinter(fonts);

  const X =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  const check =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const start = expenses.reduce((prev, current) =>
    prev && prev.date < current.date ? prev : current
  );
  const end = expenses.reduce((prev, current) =>
    prev && prev.date > current.date ? prev : current
  );

  const expenseRows: TableCell[][] = expenses.map((e) => {
    const row: TableCell[] = [
      { text: e.intNr, alignment: "center" },
      { text: e.number, alignment: "center" },
      {
        text: dayjs(e.date).locale("ro").format("DD.MM.YY"),
        alignment: "center",
      },
      { text: e.description, alignment: "center" },
      { svg: check, height: 10 },
      {
        text: `${new Intl.NumberFormat("ro-RO", {
          style: "currency",
          currency: e.currency,
        }).format(new Decimal(e.amount).toNumber())}`,
        alignment: "right",
      },
      {
        text: `${new Intl.NumberFormat("ro-RO", {
          style: "currency",
          currency: "EUR",
        }).format(new Decimal(e.amount).toNumber())}`,
        alignment: "right",
      },
    ];

    return row;
  });

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: 35,
    // pageOrientation: "landscape",
    content: [
      {
        layout: {
          //TODO
          hLineWidth: function (i, node) {
            if (
              i === 0 ||
              i === node.table.body.length ||
              i === node.table.body.length - 1
            ) {
              return 2;
            }
            return i === node.table.headerRows ? 2 : 1;
          },
        },

        table: {
          widths: ["auto", "*", "auto", "auto", "auto", "auto", "auto"],
          headerRows: 2,
          body: [
            [
              {
                text: `Cheltuieli deplasare internationala ${dayjs(start.date).locale("ro").format("MMM YYYY")} - ${dayjs(end.date).locale("ro").format("MMM YYYY")}`,
                alignment: "center",
                colSpan: 7,
                bold: true,
                fontSize: 14,
                border: [true, true, true, true],
              },
              {},
              {},
              {},
              {},
              {},
              {},
            ],
            [
              {
                text: "Nr. crt.",
                bold: true,
                fontSize: 12,
              },
              {
                text: "Nr. actului",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
              {
                text: "Data",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
              {
                text: "Descrierea",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
              {
                text: "Card",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
              {
                text: "Suma originala",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
              {
                text: "Suma in EUR",
                bold: true,
                fontSize: 12,
                alignment: "center",
              },
            ],
            ...expenseRows,
            [
              { text: " ", colSpan: 5 },
              {},
              {},
              {},
              {},
              {
                text: "Total:",
                bold: true,
                fontSize: 12,
                alignment: "center",
                border: [true, true, false, true],
              },
              {
                text: new Intl.NumberFormat("ro-RO", {
                  style: "currency",
                  currency: "EUR",
                }).format(
                  expenses
                    .reduce(
                      (accumulator, currentValue) =>
                        new Decimal(accumulator).add(
                          new Decimal(currentValue.amountEur)
                        ),
                      new Decimal(0)
                    )
                    .toNumber()
                ),
                bold: true,
                fontSize: 12,
                alignment: "right",
                border: [false, true, true, true],
              },
            ],
          ],
        },
      },
    ],
    defaultStyle: {
      fontSize: 10,
      // lineHeight: 1.25,
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

export default generateTripReportPDF;
