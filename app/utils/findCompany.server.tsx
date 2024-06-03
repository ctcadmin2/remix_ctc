import { Prisma } from "@prisma/client";
import { validate } from "vies-validate";

import { db } from "./db.server";
import { RoCountyCodes } from "./roCountyCodes";

interface OpenApiProps {
  cif: string;
  numar_reg_com: string;
  radiata: boolean;
  denumire: string;
  adresa: string;
  stare: string;
  cod_postal: string;
  judet: string;
  telefon: string;
  fax: string;
  tva: string;
  impozit_micro: string;
  impozit_profit: string;
  accize: string;
  act_autorizare: string;
  ultima_prelucrare: string;
  ultima_declaratie: string;
  tva_la_incasare: {
    tip: string;
    tip_descriere: string;
    de_la: string;
    pana_la: string;
    publicare: string;
    actualizare: string;
  }[];
  meta: {
    updated_at: string;
    last_changed_at: string;
  };
}

// Find better API for data
const findCompany = async (
  country: string | null,
  vatNr: string | null,
  refresh = false,
) => {
  //parameter guard
  if (country == null || vatNr == null) {
    return { data: null, status: 500 };
  }

  // check if company already is in db
  try {
    const local = await db.company.findFirst({
      where: { vatNumber: { search: vatNr } },
    });

    if (local && !refresh) {
      return { data: local, status: 204 };
    }

    if (country === "RO") {
      return await processRO(vatNr);
    } else {
      return processEU(country, vatNr);
    }
  } catch (error) {
    return { data: null, status: 500 };
  }
};

const processRO = async (vatNr: string) => {
  const url = `https://api.openapi.ro/api/companies/${vatNr}`;

  try {
    const res = await fetch(url, {
      headers: {
        "x-api-key": `${process.env.OPENAPI_KEY}`,
      },
    });

    if (res.status === 202 || res.status === 404) {
      return { data: null, status: 404 };
    } else if (res.status !== 200) {
      return { data: null, status: 503 };
    }

    const data: OpenApiProps = await res.json();

    if (data) {
      const company: Prisma.CompanyCreateInput = {
        name: data.denumire,
        registration: data.numar_reg_com,
        vatNumber: data.cif,
        vatValid: data.tva?.length > 0 ? true : false,
        address: data.adresa,
        county: Object.entries(RoCountyCodes).filter(
          (o) => o[1] === data.judet,
        )[0][0],
        country: "RO",
        phone: data.telefon,
      };
      return { data: company, status: 200 };
    }

    return { data: null, status: 404 };
  } catch (error) {
    return { data: null, status: 500 };
  }
};

const processEU = async (country: string, vatNr: string) => {
  try {
    const { data, error } = await validate(country, vatNr);
    if (error || data?.valid === false) {
      return { data: null, status: 404 };
    }

    if (data) {
      const company: Prisma.CompanyCreateInput = {
        name: data.name ?? "",
        vatNumber: data.vatNumber,
        vatValid: data.valid,
        address: data.address,
        country: data.countryCode,
      };
      return { data: company, status: 200 };
    }

    return { data: null, status: 404 };
  } catch (error) {
    return { data: null, status: 500 };
  }
};

export default findCompany;
