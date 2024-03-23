import { env } from "process";

import { Center, Button, Menu, Divider } from "@mantine/core";
import type { Prisma } from "@prisma/client";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, FileText, MoreHorizontal, Tool, Trash2 } from "react-feather";
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

export type Vehicle = Prisma.VehicleGetPayload<{
  select: {
    id: true;
    registration: true;
    vin: true;
    category: true;
    active: true;
  };
}>;

interface LoaderData {
  vehicles: Vehicle[];
  total: number;
  perPage: number;
}

const schema = zfd.formData({
  id: zx.NumAsString,
});

export const loader: LoaderFunction = async ({
  request,
}: LoaderFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const {
    page = 1,
    sort,
    filter,
  } = zx.parseQuery(request, {
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
              registration: {
                contains: filter,
                mode: "insensitive",
              },
            },
            {
              vin: {
                contains: filter,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const data: LoaderData = {
    vehicles: await db.vehicle.findMany({
      where,
      take: 7,
      skip: offset,
      orderBy: sortOrder({ registration: "asc" }, sort),
      select: {
        id: true,
        registration: true,
        vin: true,
        category: true,
        active: true,
      },
    }),
    total: await db.vehicle.count({ where }),
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
    const vehicle = await db.vehicle.delete({ where: { id } });

    if (vehicle) {
      return jsonWithSuccess(null, "Vehicle deleted successfully.");
    } else {
      return jsonWithError(null, "Vehicle could not be deleted.");
    }
  } catch (error) {
    return jsonWithError(null, `An error has occured: ${error}`);
  }
};

const Vehicles = () => {
  const { vehicles, total, perPage } = useLoaderData<typeof loader>();
  const [opened, setOpened] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle>();

  const handleDelete = (row: Vehicle) => {
    setVehicle(row);
    setOpened(!opened);
  };

  const columns: DataTableColumn<Vehicle>[] = [
    {
      accessor: "registration",
    },
    {
      accessor: "vin",
      textAlign: "center",
    },
    {
      accessor: "active",
      textAlign: "center",
      sortable: true,
      render: (record) => <BooleanIcon value={record.active} />,
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
                to={`${row.id}/creditNotes`}
              >
                Credit notes
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
                      <FileText
                        size={"16px"}
                        color="teal"
                        strokeWidth={"2px"}
                      />
                    }
                    to={`${row.id}/documents`}
                  >
                    Documents
                  </Menu.Item>
                  <Menu.Item
                    component={Link}
                    leftSection={
                      <Tool size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`${row.id}/repairs`}
                  >
                    Repairs
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
        data={vehicles}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<Vehicle>
        name="document"
        title={vehicle?.registration || vehicle?.vin}
        opened={opened}
        setOpened={setOpened}
        document={vehicle}
      />
    </>
  );
};

export default Vehicles;
