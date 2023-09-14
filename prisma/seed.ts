import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  const settings = [
    {
      id: 1,
      name: "diurnaBaza",
      value: ["to be removed"],
      type: "main",
      multi: false,
    },
    {
      id: 2,
      name: "salarBaza",
      value: ["to be removed"],
      type: "main",
      multi: false,
    },
    {
      id: 3,
      name: "activities",
      value: ["to be removed"],
      type: "main",
      multi: true,
    },
    {
      id: 4,
      name: "currencies",
      value: ["EUR", "RON"],
      type: "main",
      multi: true,
    },
    {
      id: 5,
      name: "paidBy",
      value: ["to be removed"],
      type: "main",
      multi: true,
    },
    {
      id: 6,
      name: "vatRates",
      value: ["0", "5", "19"],
      type: "main",
      multi: true,
    },
    {
      id: 7,
      name: "vehCat",
      value: ["to be removed"],
      type: "main",
      multi: true,
    },

    {
      id: 8,
      name: "name",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 9,
      name: "registration",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 10,
      name: "vat",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 11,
      name: "address",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 12,
      name: "accRon",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 13,
      name: "accEur",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 14,
      name: "bank",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 15,
      name: "capital",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 16,
      name: "phone",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 17,
      name: "email",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
    {
      id: 18,
      name: "contact",
      value: ["to be removed"],
      type: "company",
      multi: false,
    },
  ];

  const vehicles = Array.from({ length: 10 }).map(() => ({
    registration: faker.vehicle.vrm(),
    vin: faker.vehicle.vin(),
    category:
      settings[6].value[Math.floor(Math.random() * settings[6].value.length)],
    active: faker.datatype.boolean(),
  }));

  const companies = Array.from({ length: 10 }).map(() => ({
    name: faker.company.name(),
    vatNumber: `${faker.location.countryCode()}${faker.string.numeric(9)}`,
    vatValid: faker.datatype.boolean(),
    country: faker.location.countryCode(),
  }));

  const creditNotes = Array.from({ length: 100 }).map(() => ({
    number: faker.string.alphanumeric(5),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    paid: faker.datatype.boolean(),
    vehicleId: faker.number.int({ min: 1, max: 10 }),
    invoiceId: faker.number.int({ min: 1, max: 20 }),
  }));

  const invoices = Array.from({ length: 20 }).map(() => ({
    number: faker.string.numeric(5),
    date: faker.date.past(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    vatRate: parseInt(faker.string.numeric(2)),
    clientId: faker.number.int({ min: 1, max: 10 }),
  }));

  const nationalExpenses = Array.from({ length: 200 }).map(() => ({
    number: faker.string.alphanumeric(5),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    supplierId: faker.number.int({ min: 1, max: 10 }),
    attachment: {
      create: {
        name: faker.string.alphanumeric(5),
        url: faker.internet.url(),
      },
    },
  }));
  const internationalExpenses = Array.from({ length: 200 }).map(() => ({
    number: faker.string.alphanumeric(5),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    supplierId: faker.number.int({ min: 1, max: 10 }),
    attachment: {
      create: {
        name: faker.string.alphanumeric(5),
        url: faker.internet.url(),
      },
    },
  }));

  const tripExpenses = Array.from({ length: 200 }).map(() => ({
    number: faker.string.alphanumeric(5),
    intNr: parseInt(faker.helpers.unique(faker.string.numeric, [4], {})),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    amountEur: faker.number.int({ min: 1000, max: 10000 }),
    card: faker.datatype.boolean(),
    attachment: {
      create: {
        name: faker.string.alphanumeric(5),
        url: faker.internet.url(),
      },
    },
  }));

  const employees = Array.from({ length: 10 }).map(() => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    cnp: parseInt(faker.helpers.unique(faker.string.numeric, [13], {})),
    activ: faker.datatype.boolean(),
    payments: {
      createMany: {
        data: Array.from({ length: 10 }).map(() => ({
          totalRon: 2100,
          month: faker.date.past(),
        })),
      },
    },
    documents: {
      createMany: {
        data: Array.from({ length: 10 }).map(() => ({
          description: faker.lorem.slug(),
          expire: faker.date.past(),
          comment: "some comment",
          info: faker.datatype.boolean(),
        })),
      },
    },
  }));

  await db.setting.createMany({ data: settings });
  await db.vehicle.createMany({ data: vehicles });
  await db.company.createMany({ data: companies });
  await db.invoice.createMany({ data: invoices });
  await db.creditNote.createMany({ data: creditNotes });

  // nationalExpenses.map(async (data) => {
  //   await db.nationalExpense.create({ data })
  // })
  // internationalExpenses.map(async (data) => {
  //   await db.internationalExpense.create({ data })
  // })
  // tripExpenses.map(async (data) => {
  //   await db.tripExpense.create({ data })
  // })
  // employees.map(async (data) => {
  //   await db.employee.create({ data })
  // })
}

seed();
