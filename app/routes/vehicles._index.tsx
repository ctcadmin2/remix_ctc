import { Center, Button, Menu, Divider } from "@mantine/core";

import DataGrid from "~/components/DataGrid/DataGrid";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import type { DataTableColumn } from "mantine-datatable";
import { Link, useLoaderData } from "@remix-run/react";
import type { Prisma } from "@prisma/client";
import { env } from "process";
import { json } from "react-router-dom";
import { z } from "zod";
import { zx } from "zodix";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { Edit, FileText, MoreHorizontal, Tool, Trash2 } from "react-feather";
import {
  DEFAULT_REDIRECT,
  authenticator,
  commitSession,
  getSession,
} from "~/utils/session.server";
import type {
  ActionFunctionArgs,
  ActionFunction,
  LoaderFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import { zfd } from "zod-form-data";
import { useState } from "react";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import { redirectBack } from "remix-utils/redirect-back";
import { CSRFError } from "remix-utils/csrf/server";
import { csrf } from "~/utils/csrf.server";

export type Vehicle = Prisma.VehicleGetPayload<{
  select: {
    id: true;
    registration: true;
    vin: true;
    category: true;
    active: true;
  };
}>;

type LoaderData = {
  vehicles: Vehicle[];
  total: number;
  perPage: number;
};

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

  const vehicle = await db.vehicle.delete({ where: { id } });

  if (vehicle) {
    session.flash("toastMessage", "Vehicle deleted successfully.");
  } else {
    session.flash("toastMessage", "Vehicle could not be deleted.");
  }

  return redirectBack(request, {
    fallback: `/vehicle`,
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

const Vehicles = () => {
  const { vehicles, total, perPage } = useLoaderData<LoaderData>();
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
                    icon={
                      <Tool size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`${row.id}/repairs`}
                  >
                    Repairs
                  </Menu.Item>
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
