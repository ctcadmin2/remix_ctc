import { env } from "process";

import { Center, Button, Menu, ActionIcon } from "@mantine/core";
import { modals } from "@mantine/modals";
import type { Indemnization, Payment, Prisma } from "@prisma/client";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunction,
} from "@remix-run/server-runtime";
import Decimal from "decimal.js";
import { DataTable, type DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import {
  DollarSign,
  Edit,
  FileText,
  MoreHorizontal,
  Trash2,
} from "react-feather";
import { jsonWithError, jsonWithSuccess } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

export interface LoaderData {
  payments: Prisma.PaymentGetPayload<{
    include: {
      indemnizations: true;
    };
  }>[];
  total: number;
  perPage: number;
}

const schema = zfd.formData({
  id: zx.NumAsString,
});

export const loader: LoaderFunction = async ({ request, params }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { employeeId } = zx.parseParams(params, {
    employeeId: zx.NumAsString,
  });

  const { page, sort } = zx.parseQuery(request, {
    page: zx.NumAsString.optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
  });

  const offset = ((page || 1) - 1) * parseInt(env.ITEMS_PER_PAGE);

  const data: LoaderData = {
    payments: await db.payment.findMany({
      where: { employee: { id: employeeId } },
      include: { indemnizations: true },
      take: 7,
      skip: offset,
      orderBy: sortOrder({ month: "desc" }, sort),
    }),
    total: await db.payment.count({ where: { employee: { id: employeeId } } }),
    perPage: parseInt(env.ITEMS_PER_PAGE),
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
    await db.payment.delete({ where: { id } });
    return jsonWithSuccess(null, "Payment deleted successfully.");
  } catch (error) {
    console.error(error);
    return jsonWithError(null, "Payment could not be deleted.");
  }
};

const Payments = () => {
  const { payments, total, perPage } = useLoaderData<typeof loader>();
  const [opened, setOpened] = useState(false);
  const [payment, setPayment] = useState<Payment>();

  const handleDelete = (row: Payment) => {
    setPayment(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<typeof payments>[] = [
    {
      accessor: "month",
      textAlign: "left",
      render: ({ month }) =>
        Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
        }).format(Date.parse(month)),
    },

    {
      accessor: "salaryRon",
      textAlign: "center",
      title: "Salariu RON",
    },
    {
      accessor: "salaryEur",
      textAlign: "center",
      title: "Salariu EUR",
    },
    {
      accessor: "indemnizations",
      textAlign: "center",
      title: "EUR indemnization",
      render: ({ indemnizations }) => {
        if (indemnizations.length === 0) {
          return 0;
        }
        return indemnizations
          .reduce(
            (accumulator: Decimal, currentValue: { total: Decimal }) =>
              new Decimal(accumulator).plus(currentValue.total),
            0,
          )
          .toNumber();
      },
    },
    {
      accessor: "actions",
      textAlign: "center",
      title: <SearchInput />,
      render: (row) => {
        return (
          <Center>
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
                  styles={{ section: { marginRight: 0 } }}
                  leftSection={<MoreHorizontal strokeWidth={"1.5px"} />}
                />
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={
                    <DollarSign
                      size={"16px"}
                      color="teal"
                      strokeWidth={"2px"}
                    />
                  }
                  onClick={() => {
                    modals.open({
                      size: "lg",
                      title: `Indemnizations for ${Intl.DateTimeFormat(
                        "en-US",
                        {
                          month: "short",
                          year: "numeric",
                        },
                      ).format(Date.parse(row.month))}`,
                      children: (
                        <DataTable
                          striped
                          columns={[
                            { accessor: "perDay" },
                            { accessor: "days", textAlign: "center" },
                            { accessor: "avans", textAlign: "center" },
                            { accessor: "rest", textAlign: "center" },
                            { accessor: "total", textAlign: "center" },
                            {
                              accessor: "delegation",
                              textAlign: "center",
                              render: (row: {
                                id: string;
                                delegation: boolean;
                              }) => {
                                return <BooleanIcon value={row.delegation} />;
                              },
                            },
                            {
                              accessor: "actions",
                              textAlign: "center",
                              title: "",
                              render: (row) => {
                                return row.delegation ? (
                                  <ActionIcon
                                    variant="outline"
                                    aria-label="Order"
                                    component={Link}
                                    reloadDocument
                                    to={`employees/delegation/${row.id}.pdf`}
                                  >
                                    <FileText />
                                  </ActionIcon>
                                ) : null;
                              },
                            },
                          ]}
                          records={row.indemnizations as Indemnization[]}
                        />
                      ),
                    });
                  }}
                >
                  Indemnizations
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
          </Center>
        );
      },
    },
  ];

  return (
    <>
      <DataGrid
        data={payments}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
        extraButton={undefined}
      />
      <DeleteModal<Payment>
        name="payment"
        title="payment"
        opened={opened}
        setOpened={setOpened}
        document={payment}
      />
    </>
  );
};

export default Payments;
