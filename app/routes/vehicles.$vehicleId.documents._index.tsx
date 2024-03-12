//TODO cleanup files on attach delete

import { env } from "process";

import { Center, Button, Menu, Divider } from "@mantine/core";
import type { Prisma } from "@prisma/client";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { jsonWithSuccess, jsonWithError } from "remix-toast";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

interface LoaderData {
  documents: DocumentWithAttachement[];
  total: number;
  perPage: number;
}

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
    const document = await db.document.delete({ where: { id } });

    if (document) {
      jsonWithSuccess(null, "Document deleted successfully.");
    } else {
      jsonWithError(null, "Document could not be deleted.");
    }
  } catch (error) {
    jsonWithError(null, `An error has occured: ${error}`);
  }
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
      textAlign: "left",
    },
    {
      accessor: "expire",
      textAlign: "center",
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
                to={row.attachment === null ? "#" : `/documents/${row.id}.pdf`}
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
                    leftSection={<MoreHorizontal strokeWidth={"1.5px"} />}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    leftSection={
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`/vehicles/${row.vehicleId}/documents/${row.id}/edit`}
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
