import Decimal from "decimal.js";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const schema = zfd.formData({
  number: zfd.numeric(), //required
  date: zfd.text(z.string().datetime()), //required
  currency: zfd.text(), //required
  vatRate: zfd.numeric(), //required
  clientId: zfd.numeric(), //required
  creditNotesIds: zfd.text(z.string().optional()),
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
        id: zfd.text(z.string().optional()),
        description: zfd.text(),
        quantity: zfd.numeric(),
        amount: zfd.text(),
        total: zfd.text(),
      })
    )
    .optional(),
});

export const calculateAmount = (
  orders:
    | {
        description: string;
        quantity: number;
        amount: string;
        total: string;
      }[]
    | undefined,
  creditNotes:
    | {
        amount: Decimal;
      }[]
    | undefined
) => {
  if (creditNotes && creditNotes.length > 0) {
    return creditNotes.reduce(
      (accumulator, currentValue) =>
        new Decimal(accumulator).add(new Decimal(currentValue.amount)),
      new Decimal(0)
    );
  }
  if (orders && orders.length > 0) {
    return orders.reduce(
      (accumulator, currentValue) =>
        new Decimal(accumulator).plus(new Decimal(currentValue.total)),
      new Decimal(0)
    );
  }
  return new Decimal(0);
};

export const createIdentification = (
  identification:
    | {
        expName: string;
        expId: string;
        expVeh: string;
      }
    | undefined
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
    | undefined
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
        quantity: number;
        total: string;
      }[]
    | undefined
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
        quantity: number;
        total: string;
      }[]
    | undefined
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
