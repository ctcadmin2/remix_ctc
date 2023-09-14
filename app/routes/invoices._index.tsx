import { Center, Button, Menu, Tabs, Divider } from "@mantine/core";
import { useSearchParams, Link, useLoaderData } from "@remix-run/react";

import DataGrid from "~/components/DataGrid/DataGrid";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import type { DataTableColumn } from "mantine-datatable";
import type { Prisma } from "@prisma/client";
import { env } from "process";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { z } from "zod";
import { zx } from "zodix";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import { useState } from "react";
import type { ActionFunction, ActionArgs } from "@remix-run/server-runtime";
import { verifyAuthenticityToken, redirectBack } from "remix-utils";
import { zfd } from "zod-form-data";

export type Invoice = Prisma.InvoiceGetPayload<{
  select: {
    id: true;
    number: true;
    date: true;
    amount: true;
    currency: true;
    client: {
      select: {
        name: true;
        country: true;
        vatValid: true;
      };
    };
  };
}>;
const schema = zfd.formData({
  id: zx.NumAsString,
});

type LoaderData = {
  invoices: Invoice[];
  total: number;
  perPage: number;
};

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

  const offset = (page - 1) * 7;

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
      take: parseInt(env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ number: "asc" }, sort),
      select: {
        id: true,
        number: true,
        date: true,
        amount: true,
        currency: true,
        client: {
          select: {
            name: true,
            country: true,
            vatValid: true,
          },
        },
      },
    }),
    total: await db.invoice.count({ where }),
    perPage: parseInt(env.ITEMS_PER_PAGE),
  };

  return json(data);
};

export const action: ActionFunction = async ({ request }: ActionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));
  await verifyAuthenticityToken(request, session);

  const { id } = schema.parse(await request.formData());

  const invoice = await db.invoice.delete({ where: { id } });

  if (invoice) {
    session.flash("toastMessage", "Invoice deleted successfully.");
  } else {
    session.flash("toastMessage", "Invoice could not be deleted.");
  }

  return redirectBack(request, {
    fallback: `/invoices`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const Invoices = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices, total, perPage } = useLoaderData<LoaderData>();
  const [opened, setOpened] = useState(false);
  const [invoice, setVehicle] = useState<Invoice>();

  const handleDelete = (row: Invoice) => {
    setVehicle(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<Invoice>[] = [
    {
      accessor: "number",
      sortable: true,
    },
    {
      accessor: "date",
      textAlignment: "center",
      render: ({ date }) =>
        Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(Date.parse(date as unknown as string)),
    },

    {
      accessor: "value",
      textAlignment: "center",
      render: ({ amount, currency }) =>
        Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount / 100),
    },

    {
      accessor: "company.name",
      title: "Client",
      textAlignment: "center",
    },
    {
      accessor: "actions",
      textAlignment: "center",
      title: <SearchInput />,
      render: (row) => {
        return (
          <Center>
            <Button.Group>
              <Button
                variant="filled"
                color={"teal"}
                component={Link}
                to={`${row.id}`}
                reloadDocument
                leftIcon={<FileText />}
              >
                PDF
              </Button>
              <Divider orientation="vertical" />
              <Button
                component={Menu}
                trigger="hover"
                position="bottom-start"
                color="lime"
                withArrow
                openDelay={100}
                closeDelay={100}
              >
                <Menu.Target>
                  <Button
                    color={"teal"}
                    variant={"filled"}
                    leftIcon={<MoreHorizontal />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    icon={
                      <Edit size={"16px"} strokeWidth={"2px"} color="teal" />
                    }
                    to={`${row.id}/edit`}
                  >
                    Edit
                  </Menu.Item>

                  <Menu.Item
                    icon={
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
        onTabChange={(tab: string) => {
          searchParams.set("type", tab);
          setSearchParams(searchParams);
        }}
        keepMounted={false}
      >
        <Tabs.List>
          <Tabs.Tab value="national">National</Tabs.Tab>
          <Tabs.Tab value="international">International</Tabs.Tab>
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
          />
        </Tabs.Panel>
      </Tabs>
      <DeleteModal<Invoice>
        name="expense"
        title={invoice?.number}
        opened={opened}
        setOpened={setOpened}
        document={invoice}
      />
    </>
  );
};

export default Invoices;
