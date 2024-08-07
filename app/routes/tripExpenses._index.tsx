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
import {
  Clipboard,
  Edit,
  FileText,
  MoreHorizontal,
  Trash2,
} from "react-feather";
import {
  jsonWithError,
  jsonWithInfo,
  jsonWithSuccess,
  redirectWithError,
  redirectWithSuccess,
} from "remix-toast";
import { z } from "zod";
import { parseForm, zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export type TripExpense = Prisma.TripExpenseGetPayload<{
  include: {
    attachment: { select: { name: true } };
  };
}>;

interface LoaderData {
  expenses: TripExpense[];
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
            { intNr: { equals: Number.parseInt(filter) } },
          ],
        }
      : {}),
  };

  const data: LoaderData = {
    expenses: await db.tripExpense.findMany({
      where,
      take: Number.parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ intNr: "desc" }, sort),
      include: {
        attachment: { select: { name: true } },
      },
    }),
    total: await db.tripExpense.count({ where }),
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

  const { _action, id } = await parseForm(request, {
    _action: z.string().optional(),
    id: zx.NumAsString.optional(),
  });

  if (_action === "new") {
    try {
      const expenses = await db.tripExpense.findMany({
        where: { tripReportId: null },
        select: {
          id: true,
        },
      });
      if (expenses.length < 1) {
        return jsonWithInfo(null, "There are no new trip expenses.");
      }
      const report = await db.tripReport.create({
        data: { expenses: { connect: expenses } },
      });

      if (report) {
        return jsonWithSuccess(
          null,
          `Raport with id ${report.id} was created succesfully.`,
        );
      }

      return jsonWithError(null, "Raport could not be generated");
    } catch (error) {
      return jsonWithError(
        null,
        `Raport could not be generated with error: ${error}`,
      );
    }
  }

  try {
    await db.tripExpense.delete({ where: { id } });
    return redirectWithSuccess(
      "/tripExpenses",
      "Expense deleted successfully.",
    );
  } catch (error) {
    return redirectWithError(
      "/tripExpenses",
      `Expense could not be deleted: ${error}`,
    );
  }
};

const TripExpenses = () => {
  const { expenses, total, perPage } = useLoaderData<typeof loader>();
  const [delOpen, setDelOpen] = useState(false);
  const [expense, setExpense] = useState<TripExpense>();
  const fetcher = useFetcher();

  const handleDelete = (row: TripExpense) => {
    setExpense(row);
    setDelOpen(!delOpen);
  };

  const handleGenerateRaport = () => {
    fetcher.submit({ _action: "new" }, { method: "POST" });
  };

  const columns: DataTableColumn<TripExpense>[] = [
    {
      accessor: "intNr",
      title: "Internal number",
      textAlign: "left",
    },
    {
      accessor: "number",
      textAlign: "center",
    },
    {
      accessor: "date",
      textAlign: "center",
      render: ({ date }) =>
        Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(Date.parse(String(date))),
    },
    {
      accessor: "description",
      textAlign: "center",
    },
    {
      accessor: "amount",
      title: "Local amount",
      textAlign: "center",
      render: ({ amount, currency }) =>
        Intl.NumberFormat("ro-RO", {
          style: "currency",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
          currency: currency,
        }).format(new Decimal(amount).toNumber()),
    },
    {
      accessor: "amountEur",
      title: "EUR amount",
      textAlign: "center",
      render: ({ amountEur }) =>
        Intl.NumberFormat("ro-RO", {
          style: "currency",
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
          currency: "EUR",
        }).format(new Decimal(amountEur).toNumber()),
    },
    {
      accessor: "card",
      title: "Paid by card",
      textAlign: "center",
      sortable: true,
      render: (record) => <BooleanIcon value={record.card} />,
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
                    to={
                      row.tripReportId === null
                        ? "#"
                        : `tripReport/${row.tripReportId}.pdf`
                    }
                    disabled={row.tripReportId === null}
                    reloadDocument
                    leftSection={
                      <Clipboard
                        size={"16px"}
                        color="teal"
                        strokeWidth={"2px"}
                      />
                    }
                  >
                    {`Report nr. ${row.tripReportId}`}
                  </Menu.Item>
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
          <Button
            variant="outline"
            loading={fetcher.state === "loading"}
            onClick={handleGenerateRaport}
          >
            Generate Raport
          </Button>
        }
      />
      <DeleteModal<TripExpense>
        name="tripExpense"
        title={expense?.number ?? ""}
        opened={delOpen}
        setOpened={setDelOpen}
        document={expense}
      />
    </>
  );
};

export default TripExpenses;
