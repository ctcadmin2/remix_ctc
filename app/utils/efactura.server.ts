import { env } from "process";

import { eInvoice } from "~/routes/efactura";

import { db } from "./db.server";
import XMLBuilder from "./xmlBuilder.server";

export const upload = async (cif: string) => {
  const url = `https://api.anaf.ro/test/FCTEL/rest/upload?standart=UBL&cif=${cif}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.TOKEN}` },
      body: null,
    });
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};

export const checkStatus = async (loadIndex: string) => {
  const url = `https://api.anaf.ro/test/FCTEL/rest/upload?id_incarcare=${loadIndex}`;

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
