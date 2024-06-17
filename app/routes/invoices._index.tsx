import { env } from "node:process";

import { Button, Center, Divider, Menu, Tabs } from "@mantine/core";
import type { Prisma } from "@prisma/client";
import {
  Link,
  json,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import dayjs from "dayjs";
import { Decimal } from "decimal.js";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import EFacturaHandler from "~/components/EFactura/EFacturaHandler/EFacturaHandler";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export type Invoice = Prisma.InvoiceGetPayload<{
  select: {
    id: true;
    number: true;
    date: true;
    amount: true;
    currency: true;
    vatRate: true;
    client: {
      select: {
        name: true;
        country: true;
      };
    };
    EFactura: { select: { status: true } };
  };
}>;
const schema = zfd.formData({
  id: zx.NumAsString,
});

interface LoaderData {
  invoices: Invoice[];
  total: number;
  perPage: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const {
    type = "national",
    page = 1,
    sort,
    filter,
  } = zx.parseQuery(request, {
    type: z.string().optional(),
    page: zx.NumAsString.optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
  });

  const offset = (page - 1) * Number.parseInt(env.ITEMS_PER_PAGE);

  const where: object = {
    ...(filter
      ? {
          OR: [
            {
              number: {
                contains: filter,
                mode: "insensitive",
              },
            },
            {
              client: {
                name: {
                  contains: filter,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),
    ...(type === "international"
      ? { client: { country: { not: "RO" } } }
      : { client: { country: "RO" } }),
  };

  const data: LoaderData = {
    invoices: await db.invoice.findMany({
      where,
      take: Number.parseInt(env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ date: "desc" }, sort),
      select: {
        id: true,
        number: true,
        date: true,
        amount: true,
        currency: true,
        vatRate: true,
        client: {
          select: {
            name: true,
            country: true,
          },
        },
        EFactura: { select: { status: true } },
      },
    }),
    total: await db.invoice.count({ where }),
    perPage: Number.parseInt(env.ITEMS_PER_PAGE),
  };
  return json(data);
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    }
    console.log("other error");
  }

  const { id } = schema.parse(await request.formData());

  try {
    const invoice = await db.invoice.delete({ where: { id } });
    if (invoice) {
      return jsonWithSuccess(null, "Invoice deleted successfully.");
    }
    return jsonWithError(null, "Invoice could not be deleted.");
  } catch (error) {
    return jsonWithError(error, "An error has occured.");
  }
};

const Invoices = () => {
  const [searchParams, _setSearchParams] = useSearchParams();
  const { invoices, total, perPage } = useLoaderData<typeof loader>();
  const [opened, setOpened] = useState(false);
  const [invoice, setInvoice] = useState<Invoice>();
  const submit = useSubmit();

  const handleDelete = (row: Invoice) => {
    setInvoice(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      accessor: "number",
      sortable: true,
    },
    {
      accessor: "date",
      textAlign: "center",
      render: ({ date }) =>
        Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(Date.parse(date as unknown as string)),
    },

    {
      accessor: "amount",
      textAlign: "center",
      render: ({ amount, currency, vatRate }) =>
        Intl.NumberFormat("ro-RO", {
          style: "currency",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
          currency: currency,
        }).format(
          new Decimal(amount)
            .times(new Decimal(vatRate).dividedBy(100).add(1))
            .toNumber(),
        ),
    },

    {
      accessor: "client.name",
      title: "Client",
      textAlign: "center",
    },
    {
      accessor: "actions",
      textAlign: "center",
      title: <SearchInput />,
      render: (row) => {
        return (
          <Center>
            <Button.Group>
              <Button
                variant="filled"
                color={"teal"}
                component={Link}
                to={`${row.id}.pdf`}
                reloadDocument
                leftSection={<FileText />}
              >
                PDF
              </Button>
              <Divider orientation="vertical" />
              <Button
                component={Menu}
                trigger="hover"
                justify="bottom-start"
                color="lime"
                withArrow
                openDelay={100}
                closeDelay={100}
              >
                <Menu.Target>
                  <Button
                    color={"teal"}
                    variant={"filled"}
                    leftSection={<MoreHorizontal />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  {row.client.country === "RO" &&
                  dayjs(row.date).isAfter(dayjs("2024-01-01")) ? (
                    <EFacturaHandler invoice={row} />
                  ) : null}
                  <Menu.Item
                    component={Link}
                    leftSection={
                      <Edit size={"16px"} strokeWidth={"2px"} color="teal" />
                    }
                    to={`${row.id}/edit`}
                  >
                    Edit
                  </Menu.Item>

                  <Menu.Item
                    leftSection={
                      <Trash2 size={"16px"} color="red" strokeWidth={"2px"} />
                    }
                    onClick={() => handleDelete(row)}
                  >
                    Delete
                  </Menu.Item>
                </Menu.Dropdown>
              </Button>
            </Button.Group>
          </Center>
        );
      },
    },
  ];

  return (
    <>
      <Tabs
        radius="xs"
        value={searchParams.get("type") || "national"}
        onChange={(tab: string | null) => {
          submit({ type: tab || "national" }, { method: "get" });
        }}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab name="type" value="national">
            National
          </Tabs.Tab>
          <Tabs.Tab name="type" value="international">
            International
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="national" pl="xs">
          <DataGrid
            data={invoices}
            columns={columns as DataTableColumn<unknown>[]}
            total={total}
            perPage={perPage}
          />
        </Tabs.Panel>

        <Tabs.Panel value="international" pl="xs">
          <DataGrid
            data={invoices}
            columns={columns as DataTableColumn<unknown>[]}
            total={total}
            perPage={perPage}
            extraButton={null}
          />
        </Tabs.Panel>
      </Tabs>
      <DeleteModal<Invoice>
        name="expense"
        title={String(invoice?.number)}
        opened={opened}
        setOpened={setOpened}
        document={invoice}
      />
    </>
  );
};

export default Invoices;
