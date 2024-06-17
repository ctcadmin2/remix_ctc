import { Button, Center, Divider, Menu } from "@mantine/core";
import type { Company } from "@prisma/client";
import { Link, json, useFetcher, useLoaderData } from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import type { DataTableColumn } from "mantine-datatable";
import { useState } from "react";
import { Edit, Info, MoreHorizontal, RefreshCw, Trash2 } from "react-feather";
import {
  jsonWithError,
  jsonWithSuccess,
  redirectWithError,
  redirectWithSuccess,
} from "remix-toast";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import DetailsModal from "~/components/DataGrid/utils/InfoModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import CompanyForm from "~/forms/CompanyForm";
import { db } from "~/utils/db.server";
import findCompany from "~/utils/findCompany.server";
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
      take: Number.parseInt(process.env.ITEMS_PER_PAGE),
      skip: offset,
      orderBy: sortOrder({ name: "asc" }, sort),
    }),
    total: await db.company.count({ where }),
    perPage: Number.parseInt(process.env.ITEMS_PER_PAGE),
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
    id: zx.NumAsString.optional(),
    vatNumber: z.string().optional(),
  });
  const { id, vatNumber } = schema.parse(await request.formData());

  console.log(id, vatNumber);

  if (id) {
    try {
      await db.company.delete({ where: { id } });
      return redirectWithSuccess("/companies", "Company deleted successfully.");
    } catch (error) {
      return redirectWithError(
        "/companies",
        `Company could not be deleted: ${error}`,
      );
    }
  }

  if (vatNumber) {
    try {
      const data = await findCompany("RO", vatNumber, true);
      if (data.data) {
        try {
          const company = await db.company.update({
            where: { vatNumber },
            data: data.data,
          });

          console.log(company);
          if (company) {
            return jsonWithSuccess(null, "Company refreshed successfully.");
          }
          return jsonWithError(null, "Company could not be refreshed.");
        } catch (error) {
          return jsonWithError(
            null,
            `Company could not be refreshed: ${error}`,
          );
        }
      }
      return jsonWithError(null, "Company could not be found.");
    } catch (error) {
      return jsonWithError(null, `Company could not be refreshed: ${error}`);
    }
  }

  return jsonWithError(null, "No action defined");
};

const Companies = () => {
  const { companies, total, perPage } = useLoaderData<typeof loader>();
  const [delOpen, setDelOpen] = useState(false);
  const [company, setCompany] = useState<Company>();
  const [infoOpen, setInfoOpen] = useState(false);
  const fetcher = useFetcher({ key: "companyRefresh" });

  const handleDelete = (row: Company) => {
    setCompany(row);
    setDelOpen(!delOpen);
  };

  const handleRefresh = (vatNumber: string) => {
    fetcher.submit({ vatNumber }, { action: "/companies", method: "POST" });
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
                      <RefreshCw
                        size={"16px"}
                        color="teal"
                        strokeWidth={"2px"}
                      />
                    }
                    onClick={() => handleRefresh(row.vatNumber)}
                  >
                    Refresh company info
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
        columns={columns}
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
        form={<CompanyForm data={company} readOnly />}
      />
    </>
  );
};

export default Companies;
