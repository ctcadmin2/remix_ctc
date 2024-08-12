import Decimal from "decimal.js";
import { z } from "zod";
import { zx } from "zodix";

import bnrRate from "./bnrRate.server";

export const schema = z.object({
  number: z.string(), //required
  date: z.string().datetime(), //required
  currency: z.string(), //required
  vatRate: zx.NumAsString, //required
  clientId: zx.NumAsString, //required
  creditNotesIds: z.string().optional(),
  identification: z
    .object({
      expName: z.string(),
      expId: z.string(),
      expVeh: z.string(),
    })
    .optional(),
  orders: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string(),
        quantity: z.string(),
        amount: z.string(),
        total: z.string(),
      }),
    )
    .optional(),
});

interface amount {
  amount: Decimal;
  bnr: string | null;
  bnrAt: string | null;
}

// Improve logic
export const calculateAmount = async (
  orders:
    | {
      description: string;
      quantity: string;
      amount: string;
      total: string;
    }[]
    | undefined,
  creditNotes:
    | {
      amount: Decimal;
      currency: string;
    }[]
    | undefined,
  currency: string,
  date: string,
) => {
  const amount: amount = {
    amount: new Decimal(0),
    bnr: null,
    bnrAt: null,
  };

  if (creditNotes) {
    amount.amount = creditNotes.reduce(
      (accumulator, currentValue) =>
        new Decimal(accumulator).add(new Decimal(currentValue.amount)),
      new Decimal(0),
    );

    const xChange = creditNotes.filter((cn) => cn.currency !== currency);

    if (xChange.length > 0) {
      const rate = await bnrRate(date, xChange[0].currency);
      amount.amount = amount.amount.times(new Decimal(rate.rate));
      amount.bnr = rate.rate;
      amount.bnrAt = new Date(rate.date).toISOString();
    }
  }
  if (orders && orders.length > 0) {
    amount.amount = orders.reduce(
      (accumulator, currentValue) =>
        new Decimal(accumulator).plus(new Decimal(currentValue.total)),
      new Decimal(0),
    );
  }
  return amount;
};

export const createIdentification = (
  identification:
    | {
      expName: string;
      expId: string;
      expVeh: string;
    }
    | undefined,
) => {
  if (
    identification &&
    Object.values(identification).filter((word) => word.length > 0).length > 0
  ) {
    return {
      identification: { create: identification },
    };
  }

  return {};
};

export const updateIdentification = (
  identification:
    | {
      expName: string;
      expId: string;
      expVeh: string;
    }
    | undefined,
) => {
  if (
    identification &&
    Object.values(identification).filter((word) => word.length > 0).length > 0
  ) {
    return {
      identification: { update: identification },
    };
  }

  return {};
};

export const createOrders = (
  orders:
    | {
      id?: string;
      amount: string;
      description: string;
      quantity: string;
      total: string;
    }[]
    | undefined,
) => {
  if (orders && orders.length > 0) {
    return {
      orders: {
        create: orders.map((order) => {
          return order;
        }),
      },
    };
  }
  return {};
};

export const updateOrders = (
  orders:
    | {
      id?: string;
      amount: string;
      description: string;
      quantity: string;
      total: string;
    }[]
    | undefined,
) => {
  if (orders && orders.length > 0) {
    return {
      orders: {
        deleteMany: {},
        create: orders.map((order) => {
          return order;
        }),
      },
    };
  }
  return {};
};
