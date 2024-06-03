import { parseStringPromise } from "xml2js";

import { eInvoice } from "~/routes/efactura";

import { db } from "./db.server";
import {
  getToken,
  processMessages,
  type message,
} from "./efac/efacUtils.server";
import XMLBuilder from "./efac/xmlBuilder.server";
import FileUploader from "./uploader.server";

export const upload = async (invoice: eInvoice) => {
  const url = `https://api.anaf.ro/prod/FCTEL/rest/upload?standard=UBL&cif=17868720`;

  if (!invoice) {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getToken()}`,
      },
      body: invoice.EFactura?.xml,
    });

    if (response.status === 200) {
      const data: {
        header: { index_incarcare?: string; Errors?: { errorMessage: string } };
      } = await parseStringPromise(await response.text(), {
        trim: true,
        explicitArray: false,
        mergeAttrs: true,
      });

      if (data.header.index_incarcare) {
        try {
          const upload = await db.invoice.update({
            where: { id: invoice.id },
            data: {
              EFactura: {
                update: {
                  uploadId: data.header.index_incarcare,
                  status: "uploaded",
                  xml: null,
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

export const checkStatus = async (id: number, uploadId: string | null) => {
  if (!uploadId) {
    return { stare: "nok", Errors: [{ errorMessage: "No load index." }] };
  }

  const url = `https://api.anaf.ro/prod/FCTEL/rest/stareMesaj?id_incarcare=${uploadId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    if (response.status === 200) {
      const data: {
        header: { id_descarcare?: string; Errors?: { errorMessage: string } };
      } = await parseStringPromise(await response.text(), {
        trim: true,
        explicitArray: false,
        mergeAttrs: true,
      });

      console.log(data);

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

export const download = async (downloadId: string | null) => {
  if (!downloadId) {
    return { stare: "nok", Errors: [{ errorMessage: "No load index." }] };
  }

  const efactura = await db.eFactura.findUnique({
    where: { downloadId },
  });

  const url = `https://api.anaf.ro/prod/FCTEL/rest/descarcare?id=${downloadId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    if (response.status === 200) {
      if (response.headers.get("content-type") === "application/zip") {
        const blob: Blob = await response.blob();
        try {
          if (efactura) {
            await FileUploader([blob], "eFactura", efactura?.id);
            await db.eFactura.update({
              where: { id: efactura.id },
              data: { status: "store" },
            });
            return { stare: "ok", message: "File saved." };
          }
          return { stare: "nok", message: "Download index not found." };
        } catch (error) {
          return {
            stare: "nok",
            message: `Error while attaching file: ${error}`,
          };
        }
      }
      return {
        stare: "nok",
        message: `Server responded with: ${await response.json()}`,
      };
    }

    return {
      stare: "nok",
      message: `Server responded with: ${response.status} - ${await response.json()}`,
    };
  } catch (error) {
    return {
      stare: "nok",
      message: `Error while fetching: ${error}`,
    };
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
        Authorization: `Bearer ${await getToken()}`,
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

export const getExpenses = async () => {
  const url = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura?cif=17868720&zile=60&filtru=P`;
  // return { stare: "ok", message: "called" };
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${await getToken()}` },
    });

    console.log(response);

    if (response.status === 200) {
      const data: {
        eroare?: string;
        mesaje?: message[];
      } = await response.json();

      if (data.mesaje) {
        console.log(`there are ${data.mesaje.length} messages`);

        await processMessages(data.mesaje);
        return { stare: "ok", message: "OK" };
      }

      return { stare: "nok", message: data.eroare };
    }
    const error = await response.json();
    return { stare: "nok !200", message: error };
  } catch (error) {
    return {
      stare: "nok e",
      message: `Error while uploading ${error}`,
    };
  }
};
