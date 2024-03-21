import { Center, Button, Menu, Divider } from "@mantine/core";
import type { Company } from "@prisma/client";
import { Link, json, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, Info, MoreHorizontal, Trash2 } from "react-feather";
import { redirectWithError, redirectWithSuccess } from "remix-toast";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import DetailsModal from "~/components/DataGrid/utils/InfoModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import CompanyForm from "~/forms/CompanyForm";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

interface LoaderData {
  companies: Company[];
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
              name: {
                contains: filter,
                mode: "insensitive",
              },
            },
            { vatNumber: { contains: filter, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const data: LoaderData = {
    companies: await db.company.findMany({
      where,
      take: parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ name: "asc" }, sort),
    }),
    total: await db.company.count({ where }),
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
    await db.company.delete({ where: { id } });
    return redirectWithSuccess("/companies", "Company deleted successfully.");
  } catch (error) {
    return redirectWithError(
      "/companies",
      `Company could not be deleted: ${error}`,
    );
  }
};

const Companies = () => {
  const { companies, total, perPage } = useLoaderData<LoaderData>();
  const [delOpen, setDelOpen] = useState(false);
  const [company, setCompany] = useState<Company>();
  const [infoOpen, setInfoOpen] = useState(false);

  const handleDelete = (row: Company) => {
    setCompany(row);
    setDelOpen(!delOpen);
  };

  const columns: DataTableColumn<Company>[] = [
    {
      accessor: "name",
      textAlign: "left",
    },
    {
      accessor: "vatNumber",
      textAlign: "center",
      render: ({ vatNumber, vatValid, country }) => {
        return `${vatValid ? country : ""}${vatNumber}`;
      },
    },
    {
      accessor: "phone",
      textAlign: "center",
    },
    {
      accessor: "email",
      textAlign: "center",
    },

    {
      accessor: "contact",
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
                onClick={() => {
                  setInfoOpen(true);
                  setCompany(row);
                }}
                leftSection={<Info size={"24px"} />}
              >
                Info
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
        data={companies}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<Company>
        name="company"
        title={company?.name ?? company?.vatNumber}
        opened={delOpen}
        setOpened={setDelOpen}
        document={company}
      />
      <DetailsModal
        opened={infoOpen}
        setOpened={setInfoOpen}
        form={<CompanyForm data={company} />}
      />
    </>
  );
};

export default Companies;
