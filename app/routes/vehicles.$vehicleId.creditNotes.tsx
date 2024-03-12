import { env } from "process";

import { Center, Button, Menu, Divider } from "@mantine/core";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import Decimal from "decimal.js";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { jsonWithSuccess, jsonWithError } from "remix-toast";
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

import type { CreditNoteWithAttachement } from "./creditNotes._index";

interface LoaderData {
  creditNotes: Partial<CreditNoteWithAttachement>[];
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
    const creditNote = await db.creditNote.delete({ where: { id } });

    if (creditNote) {
      jsonWithSuccess(null, "Credit note deleted successfully.");
    } else {
      jsonWithError(null, "Credit note could not be deleted.");
    }
  } catch (error) {
    jsonWithError(null, `An error has occured: ${error}`);
  }
};

const CreditNotes = () => {
  const { creditNotes, total, perPage } = useLoaderData<typeof loader>();
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
        }).format(new Decimal(amount).toNumber()),
    },
    {
      accessor: "paid",
      textAlign: "center",
      sortable: true,
      render: (record) => (
        <BooleanIcon value={record.invoiceId ? true : false} />
      ),
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
                to={
                  row.attachment === null ? "#" : `/creditNotes/${row.id}.pdf`
                }
                disabled={row.attachment === null}
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
                    leftSection={<MoreHorizontal strokeWidth={"1.5px"} />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    leftSection={
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`/creditNotes/${row.id}/edit`}
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
