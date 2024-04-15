/* eslint-disable no-unused-vars */
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  const settings = [
    {
      id: 1,
      name: "perDay",
      value: ["65"],
      type: "main",
      multi: false,
    },
    {
      id: 2,
      name: "salary",
      value: ["2500"],
      type: "main",
      multi: false,
    },
    {
      id: 3,
      name: "descriptions",
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
      name: "paymentOptions",
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
    vehicleId: faker.number.int({ min: 1, max: 10 }),
    invoiceId: faker.number.int({ min: 1, max: 20 }),
  }));

  const invoices = Array.from({ length: 20 }).map(() => ({
    number: faker.number.int({ min: 1000, max: 10000 }),
    date: faker.date.past(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    vatRate: parseInt(faker.string.numeric(2)),
    clientId: faker.number.int({ min: 1, max: 10 }),
  }));

  const nationalExpenses = Array.from({ length: 50 }).map(() => ({
    number: faker.string.alphanumeric(5),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    supplierId: faker.number.int({ min: 1, max: 10 }),
  }));
  const internationalExpenses = Array.from({ length: 50 }).map(() => ({
    number: faker.string.alphanumeric(5),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.int({ min: 1000, max: 10000 }),
    currency: faker.finance.currencyCode(),
    supplierId: faker.number.int({ min: 1, max: 10 }),
  }));

  const tripExpenses = Array.from({ length: 50 }).map(() => ({
    number: faker.string.alphanumeric(5),
    intNr: faker.number.int({ min: 1, max: 100 }),
    date: faker.date.past(),
    description: faker.commerce.product(),
    amount: faker.number.float({ fractionDigits: 2, max: 10000 }),
    currency: faker.finance.currencyCode(),
    amountEur: faker.number.float({ fractionDigits: 2, max: 10000 }),
    card: faker.datatype.boolean(),
  }));

  const employees = Array.from({ length: 10 }).map(() => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    ssn: faker.string.numeric(13),
    active: faker.datatype.boolean(),
  }));

  await db.user.create({
    data: {
      firstName: "sega",
      lastName: "test",
      email: "sega@sega.org",
      language: "en",
      hash: "$2a$10$ASUExexWpsLTZklz5ZqEI.zducNPjPlJ1IB6zeElsS2wADpD5kESm",
    },
  });

  await db.setting.createMany({ data: settings, skipDuplicates: true });
  await db.vehicle.createMany({ data: vehicles, skipDuplicates: true });
  await db.company.createMany({ data: companies, skipDuplicates: true });
  await db.invoice.createMany({ data: invoices, skipDuplicates: true });
  await db.creditNote.createMany({ data: creditNotes, skipDuplicates: true });
  await db.tripExpense.createMany({ data: tripExpenses, skipDuplicates: true });
  await db.nationalExpense.createMany({
    data: nationalExpenses,
    skipDuplicates: true,
  });
  await db.internationalExpense.createMany({
    data: internationalExpenses,
    skipDuplicates: true,
  });
  employees.map(
    async (e) =>
      await db.employee.create({
        data: {
          ...e,
          payments: {
            createMany: {
              data: Array.from({ length: 10 }).map(() => ({
                salaryRon: 2100,
                salaryEur: 2100,
                month: faker.date.past().toISOString(),
              })),
            },
          },
          documents: {
            createMany: {
              data: Array.from({ length: 10 }).map(() => ({
                description: faker.lorem.slug(),
                expire: faker.date.past(),
                comment: "some comment",
              })),
            },
          },
        },
      }),
  );
}

// seed();
