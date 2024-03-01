import { Center, Button, Menu, Divider, Modal, Flex } from "@mantine/core";
import { MonthPicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import type { Employee } from "@prisma/client";
import { Link, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import {
  DollarSign,
  Edit,
  FileText,
  MoreHorizontal,
  Trash2,
} from "react-feather";
import type { LoaderFunction } from "react-router-dom";
import { json } from "react-router-dom";
import { redirectWithError, redirectWithSuccess } from "remix-toast";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

interface LoaderData {
  employees: Employee[];
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
              firstName: {
                contains: filter,
                mode: "insensitive",
              },
            },
            { lastName: { contains: filter, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const data: LoaderData = {
    employees: await db.employee.findMany({
      where,
      take: parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ lastName: "asc" }, sort),
    }),
    total: await db.employee.count({ where }),
    perPage: parseInt(process.env.ITEMS_PER_PAGE),
  };

  return json(data);
};

export const action: ActionFunction = async ({
  request,
}: ActionFunctionArgs) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const schema = zfd.formData({
    id: zx.NumAsString,
  });
  const { id } = schema.parse(await request.formData());

  try {
    await db.employee.delete({ where: { id } });
    return redirectWithSuccess("/employees", "Employee deleted successfully.");
  } catch (error) {
    return redirectWithError(
      "/employees",
      `Employee could not be deleted: ${error}`
    );
  }
};

const Companies = () => {
  const { employees, total, perPage } = useLoaderData<LoaderData>();
  const [delOpen, setDelOpen] = useState(false);
  const [employee, setEmployee] = useState<Employee>();
  const [opened, { open, close }] = useDisclosure(false);
  const [month, setMonth] = useState(new Date());

  const handleDelete = (row: Employee) => {
    setEmployee(row);
    setDelOpen(!delOpen);
  };

  const columns: DataTableColumn<Employee>[] = [
    {
      accessor: "firstName",
      textAlign: "left",
    },
    {
      accessor: "lastName",
      textAlign: "center",
    },
    {
      accessor: "activ",
      textAlign: "center",
      render: (record) => <BooleanIcon value={record.activ} />,
    },
    {
      accessor: "ssn",
      title: "SSN",
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
                component={Link}
                to={`${row.id}/payments`}
                variant="filled"
                color={"teal"}
                leftSection={<DollarSign size={"16px"} />}
              >
                Payments
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
                    leftSection={
                      <FileText
                        size={"16px"}
                        color="teal"
                        strokeWidth={"2px"}
                      />
                    }
                  >
                    Documents
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
        data={employees}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
        extraButton={
          <Button variant="outline" onClick={open}>
            Generate report
          </Button>
        }
      />
      <DeleteModal<Employee>
        name="company"
        title={`${employee?.firstName} ${employee?.lastName}`}
        opened={delOpen}
        setOpened={setDelOpen}
        document={employee}
      />
      <Modal opened={opened} onClose={close} title="Select month">
        <MonthPicker
          maxLevel="year"
          value={month}
          onChange={(v) => setMonth(new Date(v))}
        />
        <Divider />
        <Flex>
          <Button
            component={Link}
            to={`/employees/paymentsReport.pdf?month=${month}`}
            reloadDocument
            state={{ month }}
          >
            Submit
          </Button>
        </Flex>
      </Modal>
    </>
  );
};

export default Companies;
