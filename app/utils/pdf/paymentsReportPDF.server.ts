import Decimal from "decimal.js";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions, type TableCell } from "pdfmake/interfaces";

import { reportIndemnizations } from "~/routes/employees.paymentsReport[.]pdf";

const fonts = {
  Roboto: {
    normal: "public/assets/fonts/Roboto/Roboto-Regular.ttf",
    bold: "public/assets/fonts/Roboto/Roboto-Bold.ttf",
  },
};

const paymentsReportPDF = async (
  data: reportIndemnizations[] | null,
  date: string,
) => {
  const doc = new PdfPrinter(fonts);
  const indemnizations: reportIndemnizations[] = [];
  const delegations: reportIndemnizations[] = [];

  data?.map((i) => {
    if (i.delegation) {
      delegations.push(i);
    } else {
      indemnizations.push(i);
    }
  });

  const indemnizationsDef = () => {
    const lines: TableCell[][] = [
      [
        {
          text: "Detasare transnationala",
          colSpan: 6,
          bold: true,
          fontSize: 14,
        },
        {},
        {},
        {},
        {},
        {},
      ],
      [
        {
          text: "Nume angajat",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Avans",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Rest",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Total",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Zile",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Per zi",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
      ],
    ];
    indemnizations.map((i) => {
      lines.push([
        {
          text: `${i.Payment?.employee.firstName} ${i.Payment?.employee.lastName}`,
        },
        { text: new Decimal(i.avans).toString(), alignment: "center" },
        { text: new Decimal(i.rest).toString(), alignment: "center" },
        { text: new Decimal(i.total).toString(), alignment: "center" },
        { text: i.days, alignment: "center" },
        { text: i.perDay, alignment: "center" },
      ]);
    });

    return lines;
  };

  const delegationsDef = () => {
    const lines: TableCell[][] = [
      [
        {
          text: "Delegare",
          colSpan: 6,
          bold: true,
          fontSize: 14,
        },
        {},
        {},
        {},
        {},
        {},
      ],
      [
        {
          text: "Nume angajat",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Avans",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Rest",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Total",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Zile",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
        {
          text: "Per zi",
          alignment: "center",
          bold: true,
          fontSize: 12,
        },
      ],
    ];

    delegations.map((i) => {
      lines.push([
        {
          text: `${i.Payment?.employee.firstName} ${i.Payment?.employee.lastName}`,
        },
        { text: new Decimal(i.avans).toString(), alignment: "center" },
        { text: new Decimal(i.rest).toString(), alignment: "center" },
        { text: new Decimal(i.total).toString(), alignment: "center" },
        { text: i.days, alignment: "center" },
        { text: i.perDay, alignment: "center" },
      ]);
    });

    return lines;
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: 35,
    content: [
      {
        table: {
          widths: ["*", "*", "*", "*", "*", "*"],
          body: [
            [
              {
                text: `Cheltuieli deplasare internationala ${date}`,
                alignment: "center",
                colSpan: 6,
                bold: true,
                fontSize: 16,
              },
              {},
              {},
              {},
              {},
              {},
            ],
            ...(indemnizations.length > 0 ? indemnizationsDef() : []),
            ...(indemnizations.length > 0 ? delegationsDef() : []),
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

export default paymentsReportPDF;

// const build_entry = (left_text, right_text, text_size = 8) => {
//     left_text_width = font.compute_width_of(left_text, size: text_size)
//     right_text_width = font.compute_width_of(right_text, size: text_size)
//     dot_width = font.compute_width_of('. ', size: text_size)
//     space_width = font.compute_width_of(' ', size: text_size)

//     space_for_dots = 286 - left_text_width - right_text_width - dot_width * 5 - space_width * 2
//     dots = '. ' * (space_for_dots / dot_width)

//     "#{left_text} #{'. ' * 5}#{right_text} #{dots}"
//   end
// }
