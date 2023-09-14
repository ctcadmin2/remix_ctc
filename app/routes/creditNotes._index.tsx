import { Center, Button, Menu, Divider } from "@mantine/core";
import { useLocation, Link, useLoaderData } from "@remix-run/react";

import DataGrid from "~/components/DataGrid/DataGrid";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import type { DataTableColumn } from "mantine-datatable";
import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { z } from "zod";
import { zx } from "zodix";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { useState } from "react";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import type { ActionFunction, ActionArgs } from "@remix-run/server-runtime";
import { verifyAuthenticityToken, redirectBack } from "remix-utils";
import { zfd } from "zod-form-data";

export type CreditNoteWithAttachement = Prisma.CreditNoteGetPayload<{
  select: {
    id: true;
    number: true;
    start: true;
    end: true;
    week: true;
    amount: true;
    currency: true;
    paid: true;
    notes: true;
    vehicle: {
      select: {
        registration: true;
      };
    };
    attachment: {
      select: {
        id: true;
      };
    };
  };
}>;

type LoaderData = {
  creditNotes: CreditNoteWithAttachement[];
  total: number;
  perPage: number;
};

const schema = zfd.formData({
  id: zx.NumAsString,
});

export const loader: LoaderFunction = async ({ request, params }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.IntAsString.optional(),
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
            { start: { contains: filter, mode: "insensitive" } },
            { end: { contains: filter, mode: "insensitive" } },
            {
              vehicle: {
                is: {
                  registration: {
                    contains: filter,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(vehicleId ? { vehicle: { id: vehicleId } } : {}),
  };

  const data: LoaderData = {
    creditNotes: await db.creditNote.findMany({
      where,
      take: parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ orderNr: "asc" }, sort),
      select: {
        id: true,
        number: true,
        start: true,
        end: true,
        week: true,
        amount: true,
        currency: true,
        paid: true,
        notes: true,
        vehicle: {
          select: {
            registration: true,
          },
        },
        attachment: {
          select: {
            id: true,
          },
        },
      },
    }),
    total: await db.creditNote.count({ where }),
    perPage: parseInt(process.env.ITEMS_PER_PAGE),
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

  const creditNote = await db.creditNote.delete({ where: { id } });

  if (creditNote) {
    session.flash("toastMessage", "Credit note deleted successfully.");
  } else {
    session.flash("toastMessage", "Credit note could not be deleted.");
  }

  return redirectBack(request, {
    fallback: `/creditNotes`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const CreditNotes = () => {
  const { pathname } = useLocation();
  const { creditNotes, total, perPage } = useLoaderData<LoaderData>();
  const [opened, setOpened] = useState(false);
  const [creditNote, setVehicle] = useState<CreditNoteWithAttachement>();

  const handleDelete = (row: CreditNoteWithAttachement) => {
    setVehicle(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<CreditNoteWithAttachement>[] = [
    {
      accessor: "orderNr",
      title: "Order Nr.",
      hidden: pathname === "/creditNotes" ? true : false,
    },
    {
      accessor: "number",
      textAlignment: `${pathname === "/creditNotes" ? "left" : "center"}`,
      sortable: true,
    },
    {
      accessor: "start",
      textAlignment: "center",
    },
    {
      accessor: "end",
      textAlignment: "center",
    },
    {
      accessor: "week",
      textAlignment: "center",
    },
    {
      accessor: "value",
      textAlignment: "center",
      render: ({ amount, currency }) =>
        Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount),
    },
    {
      accessor: "paid",
      textAlignment: "center",
      sortable: true,
      render: (record) => <BooleanIcon value={record.paid} />,
    },
    {
      accessor: "vehicle.registration",
      title: "Vehicle",
      textAlignment: "center",
    },
    {
      accessor: "notes",
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
                disabled={row.attachment === null}
                reloadDocument
                leftIcon={<FileText size={"24px"} />}
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
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
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
      <DataGrid
        data={creditNotes}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<CreditNoteWithAttachement>
        name="expense"
        title={creditNote?.number}
        opened={opened}
        setOpened={setOpened}
        document={creditNote}
      />
    </>
  );
};

export default CreditNotes;
