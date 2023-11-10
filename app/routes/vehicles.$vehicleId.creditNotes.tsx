import { Center, Button, Menu, Divider } from "@mantine/core";
import { Link, useLoaderData } from "@remix-run/react";

import DataGrid from "~/components/DataGrid/DataGrid";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import type { DataTableColumn } from "mantine-datatable";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { db } from "~/utils/db.server";
import { env } from "process";
import { zx } from "zodix";
import { sortOrder } from "~/utils/helpers.server";
import { z } from "zod";
import type { CreditNoteWithAttachement } from "./creditNotes._index";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import { useState } from "react";
import type {
  ActionFunction,
  ActionFunctionArgs,
} from "@remix-run/server-runtime";
import { zfd } from "zod-form-data";
import { redirectBack } from "remix-utils/redirect-back";
import { CSRFError } from "remix-utils/csrf/server";
import { csrf } from "~/utils/csrf.server";

type LoaderData = {
  creditNotes: Partial<CreditNoteWithAttachement>[];
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
    vehicleId: zx.NumAsString,
  });

  const { page, sort, filter } = zx.parseQuery(request, {
    page: zx.NumAsString.optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
  });

  const offset = ((page || 1) - 1) * parseInt(env.ITEMS_PER_PAGE);

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
          ],
        }
      : {}),
    vehicle: { id: vehicleId },
  };

  const data: LoaderData = {
    creditNotes: await db.creditNote.findMany({
      where,
      take: 7,
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
        attachment: {
          select: {
            id: true,
          },
        },
      },
    }),
    total: await db.creditNote.count({ where }),
    perPage: parseInt(env.ITEMS_PER_PAGE),
  };

  return json(data);
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));

  try {
    await csrf.validate(request);
  } catch (error) {
    if (error instanceof CSRFError) {
      console.log("csrf error");
    }
    console.log("other error");
  }

  const { id } = schema.parse(await request.formData());
  const { vehicleId } = zx.parseParams(params, {
    vehicleId: zx.NumAsString,
  });

  const creditNote = await db.creditNote.delete({ where: { id } });

  if (creditNote) {
    session.flash("toastMessage", "Credit note deleted successfully.");
  } else {
    session.flash("toastMessage", "Credit note could not be deleted.");
  }

  return redirectBack(request, {
    fallback: `/vehicle/${vehicleId}/creditNotes`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const CreditNotes = () => {
  const { creditNotes, total, perPage } = useLoaderData();
  const [opened, setOpened] = useState(false);
  const [creditNote, setCreditNote] = useState<CreditNoteWithAttachement>();

  const handleDelete = (row: CreditNoteWithAttachement) => {
    setCreditNote(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<CreditNoteWithAttachement>[] = [
    {
      accessor: "orderNr",
      title: "Order Nr.",
    },
    {
      accessor: "number",
      textAlign: "center",
      sortable: true,
    },
    {
      accessor: "start",
      textAlign: "center",
    },
    {
      accessor: "end",
      textAlign: "center",
    },
    {
      accessor: "week",
      textAlign: "center",
    },
    {
      accessor: "value",
      textAlign: "center",
      render: ({ amount, currency }) =>
        Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(amount),
    },
    {
      accessor: "paid",
      textAlign: "center",
      sortable: true,
      render: (record) => <BooleanIcon value={record.paid} />,
    },
    {
      accessor: "notes",
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
                to={`${row.id}`}
                disabled={row.attachment === null}
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
                    leftIcon={<MoreHorizontal strokeWidth={"1.5px"} />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    icon={
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`/creditNotes/${row.id}/edit`}
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
        name="credit note"
        title={creditNote?.number}
        opened={opened}
        setOpened={setOpened}
        document={creditNote}
      />
    </>
  );
};

export default CreditNotes;
