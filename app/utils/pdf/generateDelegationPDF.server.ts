import { Indemnization } from "@prisma/client";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";

const fonts = {
  Roboto: {
    normal: "public/assets/fonts/Roboto/Roboto-Regular.ttf",
    bold: "public/assets/fonts/Roboto/Roboto-Bold.ttf",
  },
};

const generateDelegationPDF = async (indemnization: Indemnization | null) => {
  const doc = new PdfPrinter(fonts);

  console.log(indemnization);

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: 35,
    content: [
      {
        columns: [
          {
            width: "*",
            table: {
              widths: ["*", "*", "*"],
              body: [
                [
                  {
                    text: "Unitatea",
                    alignment: "center",
                  },
                  {
                    text: "Depus decontul (numarul si data)",
                    colSpan: 2,
                    alignment: "right",
                  },
                ],
                [
                  {
                    text: "SC. Cozma Transport 2005 SRL",
                    colSpan: 2,
                    bold: true,
                  },
                  {},
                  {
                    text: "1 din data",
                    alignment: "right",
                  },
                ],
                [{ text: " ", colSpan: 3 }, {}, {}],
                [
                  {
                    text: "Ordin de deplasare",
                    colSpan: 3,
                    alignment: "center",
                    bold: true,
                  },
                  {},
                  {},
                ],
                [{ text: " ", colSpan: 3 }, {}, {}],
                [
                  {
                    text: "Domnul(a). . . . . @payment.employee.name".padEnd(
                      100,
                      ". ",
                    ),
                    colSpan: 3,
                  },
                  {},
                  {},
                ],
              ],
            },
            layout: {
              hLineWidth: function (i, node) {
                // console.log(node);
                return i === 0 || i === node.table.body.length ? 2 : 0;
              },
              vLineWidth: function (i, node) {
                return i === 0 || i === node.table.widths?.length ? 2 : 0;
              },
              // hLineColor: function (i, node) {
              //   return i === 0 || i === node.table.body.length
              //     ? "black"
              //     : "gray";
              // },
              // vLineColor: function (i, node) {
              //   return i === 0 || i === node.table.widths.length
              //     ? "black"
              //     : "gray";
              // },
              // hLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              // vLineStyle: function (i, node) { return {dash: { length: 10, space: 4 }}; },
              // paddingLeft: function(i, node) { return 4; },
              // paddingRight: function(i, node) { return 4; },
              // paddingTop: function(i, node) { return 2; },
              // paddingBottom: function(i, node) { return 2; },
              // fillColor: function (rowIndex, node, columnIndex) { return null; }
            },
          },
          {
            width: "*",
            table: {
              widths: ["33%", "33%", "33%"],
              body: [
                [
                  { text: "Unitatea" },
                  {
                    text: "Depus decontul (numarul si data)",
                    colSpan: 2,
                    alignment: "right",
                  },
                ],
                // [
                //   { text: "SC. Cozma Transport 2005 SRL", colSpan: 2 },
                //   {
                //     text: "#{'. ' * 3}#{generate_number} din #{last_day.strftime('%d/%m/%Y')} #{'. ' * 4}",
                //   },
                // ],
                // [{ text: "Ordin de deplasare", colSpan: 3 }],
                // [{ text: "Domnul (a) @payment.employee.name", colSpan: 3 }],
              ],
            },
          },
        ],
        // optional space between columns
        columnGap: 10,
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

export default generateDelegationPDF;

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
