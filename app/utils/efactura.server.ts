import { env } from "process";

import { XMLParser } from "fast-xml-parser";

import { eInvoice } from "~/routes/efactura";

import { db } from "./db.server";
import XMLBuilder from "./xmlBuilder.server";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  ignoreDeclaration: true,
});

export const upload = async (invoice: eInvoice) => {
  const url = `https://api.anaf.ro/prod/FCTEL/rest/upload?standard=UBL&cif=17868720`;

  if (!invoice) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TOKEN}`,
      },
      body: invoice.EFactura?.xml,
    });

    if (response.status === 200) {
      const data: {
        header: { index_incarcare?: string; Errors?: { errorMessage: string } };
      } = parser.parse(await response.text());
      if (data.header.index_incarcare) {
        try {
          const upload = await db.invoice.update({
            where: { id: invoice.id },
            data: {
              EFactura: {
                update: {
                  loadIndex: data.header.index_incarcare,
                  status: "uploaded",
                },
              },
            },
          });
          if (upload) {
            return { stare: "ok", message: "XML uploaded." };
          }
          return {
            stare: "nok",
            message: `Invoice could not be updated. Load index is ${data.header.index_incarcare}`,
          };
        } catch (error) {
          return {
            stare: "nok",
            message: `There has been an error: ${error}`,
          };
        }
      }
      return {
        stare: "nok",
        message: `Error while uploading ${data.header.Errors?.errorMessage}`,
      };
    }

    return { stare: "nok", message: await response.json() };
  } catch (error) {
    return {
      stare: "nok",
      message: `Error while uploading ${error}`,
    };
  }
};

export const checkStatus = async (id: number, loadIndex: string | null) => {
  if (!loadIndex) {
    return { stare: "nok", Errors: [{ errorMessage: "No load index." }] };
  }

  const url = `https://api.anaf.ro/prod/FCTEL/rest/stareMesaj?id_incarcare=${loadIndex}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.TOKEN}` },
    });

    if (response.status === 200) {
      const data: {
        header: { id_descarcare?: string; Errors?: { errorMessage: string } };
      } = parser.parse(await response.text());

      if (data.header.id_descarcare) {
        try {
          const valid = await db.invoice.update({
            where: { id },
            data: {
              EFactura: {
                update: {
                  downloadId: data.header.id_descarcare,
                  status: "valid",
                },
              },
            },
          });
          if (valid) {
            return { stare: "ok", message: "Invoice valid." };
          }
          return {
            stare: "nok",
            message: `Invoice could not be updated.`,
          };
        } catch (error) {
          return {
            stare: "nok",
            message: `There has been an error: ${error}`,
          };
        }
      }
      return {
        stare: "nok",
        message: `Error while validating: ${data.header.Errors?.errorMessage}`,
      };
    }

    return { stare: "nok", message: await response.json() };
  } catch (error) {
    return {
      stare: "nok",
      message: `Error while uploading ${error}`,
    };
  }
};

export const download = async (downloadIndex: string) => {
  const url = `https://api.anaf.ro/test/FCTEL/rest//descarcare?id=${downloadIndex}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${env.TOKEN}` },
    });
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};

export const validate = async (invoice: eInvoice) => {
  const url = `https://api.anaf.ro/prod/FCTEL/rest/validare/FACT1`;
  const xml = await XMLBuilder(invoice);

  if (!invoice) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: xml,
    });

    const data = await response.json();

    if (data.stare === "ok") {
      const valid = await db.invoice.update({
        where: { id: invoice.id },
        data: {
          EFactura: {
            upsert: {
              create: { status: "validated", xml },
              update: { status: "validated", xml },
            },
          },
        },
      });
      if (valid) {
        return { stare: "ok", Messages: [] };
      }
      return {
        stare: "nok",
        Messages: [{ message: "Status could not be updated." }],
      };
    }

    return data;
  } catch (error) {
    console.error("error: ", error);
    return { stare: "nok", Messages: [{ message: `${error}` }] };
  }
};
