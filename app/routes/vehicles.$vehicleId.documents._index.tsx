//TODO cleanup files on attach delete

import { Center, Button, Menu, Divider } from "@mantine/core";
import { Link, useLoaderData } from "@remix-run/react";

import DataGrid from "~/components/DataGrid/DataGrid";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import type { DataTableColumn } from "mantine-datatable";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { db } from "~/utils/db.server";
import { env } from "process";
import { zx } from "zodix";
import { sortOrder } from "~/utils/helpers.server";
import { z } from "zod";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import type { Prisma } from "@prisma/client";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import { redirectBack, verifyAuthenticityToken } from "remix-utils";
import type { ActionFunction, ActionArgs } from "@remix-run/server-runtime";
import { zfd } from "zod-form-data";
import { useState } from "react";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";

type LoaderData = {
  documents: DocumentWithAttachement[];
  total: number;
  perPage: number;
};

type DocumentWithAttachement = Prisma.DocumentGetPayload<{
  select: {
    id: true;
    description: true;
    expire: true;
    comment: true;
    vehicleId: true;
    attachment: {
      select: {
        id: true;
      };
    };
  };
}>;

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
              comment: {
                contains: filter,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filter,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    vehicleId,
  };

  const data: LoaderData = {
    documents: await db.document.findMany({
      where,
      take: 7,
      skip: offset,
      orderBy: sortOrder({ description: "asc" }, sort),
      select: {
        id: true,
        description: true,
        expire: true,
        comment: true,
        vehicleId: true,
        attachment: {
          select: {
            id: true,
          },
        },
      },
    }),
    total: await db.document.count({ where }),
    perPage: parseInt(env.ITEMS_PER_PAGE),
  };

  return json(data);
};

export const action: ActionFunction = async ({
  request,
  params,
}: ActionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const session = await getSession(request.headers.get("Cookie"));
  await verifyAuthenticityToken(request, session);

  const { id } = schema.parse(await request.formData());
  const { vehicleId } = zx.parseParams(params, { vehicleId: zx.NumAsString });

  const document = await db.document.delete({ where: { id } });

  if (document) {
    session.flash("toastMessage", "Document deleted successfully.");
  } else {
    session.flash("toastMessage", "Document could not be deleted.");
  }

  return redirectBack(request, {
    fallback: `/vehicles/${vehicleId}/documents`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const Documents = () => {
  const { documents, total, perPage } = useLoaderData<LoaderData>();
  const [opened, setOpened] = useState(false);
  const [document, setDocument] = useState<DocumentWithAttachement>();

  const handleDelete = (row: DocumentWithAttachement) => {
    setDocument(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<DocumentWithAttachement>[] = [
    {
      accessor: "description",
      textAlignment: "left",
    },
    {
      accessor: "expire",
      textAlignment: "center",
      render: ({ expire }) =>
        expire &&
        Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(Date.parse(expire as unknown as string)),
    },

    {
      accessor: "comment",
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
                to={`${row.id}/pdf`}
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
                    leftIcon={<MoreHorizontal strokeWidth={"1.5px"} />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    icon={
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`/vehicles/${row.vehicleId}/documents/${row.id}/edit`}
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
        data={documents}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<DocumentWithAttachement>
        name="document"
        title={document?.description}
        opened={opened}
        setOpened={setOpened}
        document={document}
      />
    </>
  );
};

export default Documents;
