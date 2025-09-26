import { Button, Center, Divider, Menu } from "@mantine/core";
import type { Prisma } from "@prisma/client";
import { Link, json, useFetcher, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import Decimal from "decimal.js";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { redirectWithError, redirectWithSuccess } from "remix-toast";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export type NationalExpense = Prisma.NationalExpenseGetPayload<{
  include: {
    supplier: { select: { name: true } };
    attachment: { select: { name: true } };
  };
}>;

interface LoaderData {
  expenses: NationalExpense[];
  total: number;
  perPage: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { page, sort, filter } = zx.parseQuery(request, {
    page: zx.NumAsString.optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
  });

  const offset = ((page || 1) - 1) * 7;

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
            { supplier: { name: { contains: filter, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const data: LoaderData = {
    expenses: await db.nationalExpense.findMany({
      where,
      take: Number.parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ date: "desc" }, sort),
      include: {
        supplier: { select: { name: true } },
        attachment: { select: { name: true } },
      },
    }),
    total: await db.nationalExpense.count({ where }),
    perPage: Number.parseInt(process.env.ITEMS_PER_PAGE),
  };

  return json(data);
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const schema = zfd.formData({
    id: zx.NumAsString,
  });
  const { id } = schema.parse(await request.formData());

  try {
    await db.nationalExpense.delete({ where: { id } });
    return redirectWithSuccess(
      "/nationalExpenses",
      "Expense deleted successfully."
    );
  } catch (error) {
    return redirectWithError(
      "/nationalExpenses",
      `Expense could not be deleted: ${error}`
    );
  }
};

const NationalExpenses = () => {
  const { expenses, total, perPage } = useLoaderData<typeof loader>();
  const [delOpen, setDelOpen] = useState(false);
  const [expense, setExpense] = useState<NationalExpense>();
  const fetcher = useFetcher({ key: "getNew" });

  const handleDelete = (row: NationalExpense) => {
    setExpense(row);
    setDelOpen(!delOpen);
  };

  const handleGetNew = () => {
    fetcher.submit({ getNew: true }, { action: "/efactura", method: "POST" });
  };

  // const handleProcess = () => {
  //   fetcher.submit({ process: true }, { action: "/efactura", method: "POST" });
  // };

  const columns: DataTableColumn<NationalExpense>[] = [
    {
      accessor: "number",
      textAlign: "left",
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
      render: ({ amount }) =>
        Intl.NumberFormat("ro-RO", {
          style: "currency",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
          currency: "RON",
        }).format(new Decimal(amount).toNumber()),
    },
    {
      accessor: "supplier.name",
      textAlign: "center",
    },

    {
      accessor: "description",
      textAlign: "center",
    },

    {
      accessor: "paidBy",
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
                to={row.attachment === null ? "#" : `${row.id}.pdf`}
                disabled={row.attachment === null}
                reloadDocument
                leftSection={<FileText size={"24px"} />}
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
                  <Menu.Item
                    component={Link}
                    leftSection={
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
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
      <DataGrid
        data={expenses}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
        extraButton={
          <>
            <Button
              variant="outline"
              loading={fetcher.state === "loading"}
              onClick={handleGetNew}
            >
              Load E-Factura
            </Button>
            {/* <Button
              variant="outline"
              loading={fetcher.state === "loading"}
              onClick={handleProcess}
            >
              Process
            </Button> */}
          </>
        }
      />
      <DeleteModal<NationalExpense>
        name="nationalExpense"
        title={expense?.number}
        opened={delOpen}
        setOpened={setDelOpen}
        document={expense}
      />
    </>
  );
};

export default NationalExpenses;
