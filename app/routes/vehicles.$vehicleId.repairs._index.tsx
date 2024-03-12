import { env } from "process";

import { Center, Button, Menu } from "@mantine/core";
import type { Repair } from "@prisma/client";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, MoreHorizontal, Trash2 } from "react-feather";
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
  repairs: Repair[];
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
          comment: {
            contains: filter,
            mode: "insensitive",
          },
        }
      : {}),
    vehicle: { id: vehicleId },
  };

  const data: LoaderData = {
    repairs: await db.repair.findMany({
      where,
      take: 7,
      skip: offset,
      orderBy: sortOrder({ date: "asc" }, sort),
    }),
    total: await db.repair.count({ where }),
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
    const repair = await db.repair.delete({ where: { id } });

    if (repair) {
      return jsonWithSuccess(null, "Repair data was deleted successfully.");
    } else {
      return jsonWithError(null, "Repair data could not be deleted.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

const Repairs = () => {
  const { repairs, total, perPage } = useLoaderData<typeof loader>();
  const [opened, setOpened] = useState(false);
  const [repair, setRepair] = useState<Repair>();

  const handleDelete = (row: Repair) => {
    setRepair(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<Repair>[] = [
    {
      accessor: "date",
      textAlign: "left",
      render: ({ date }) =>
        Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(Date.parse(date as unknown as string)),
    },
    {
      accessor: "km",
      textAlign: "center",
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
        data={repairs}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<Repair>
        name="repair"
        title="repair"
        opened={opened}
        setOpened={setOpened}
        document={repair}
      />
    </>
  );
};

export default Repairs;
