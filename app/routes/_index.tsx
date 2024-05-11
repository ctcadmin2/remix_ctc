import { ScrollArea, Title } from "@mantine/core";
import { Prisma } from "@prisma/client";
import { json, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import dayjs from "dayjs";
import { DataTable, type DataTableColumn } from "mantine-datatable";

import { db } from "~/utils/db.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

type documents = Prisma.DocumentGetPayload<{
  include: {
    Vehicle: { select: { registration: true } };
    Employee: { select: { firstName: true; lastName: true } };
  };
}>[];

interface headersType {
  id: number;
  owner: string;
  description: string;
  expire: string;
  comment: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, {
    failureRedirect: DEFAULT_REDIRECT,
  });

  const data: documents = await db.document.findMany({
    where: {
      expire: {
        lte: dayjs().add(1, "month").toDate().toISOString(),
      },
      OR: [{ Vehicle: { active: true } }, { Employee: { active: true } }],
    },
    include: {
      Vehicle: { select: { registration: true } },
      Employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ expire: "asc" }, { Employee: { id: "asc" } }],
  });
  return json(data);
};

const Main = () => {
  const data = useLoaderData<documents>();

  const headers: headersType[] = [
    { id: 1, owner: "Vehicle", description: "", expire: "", comment: "" },
    { id: 2, owner: "Employee", description: "", expire: "", comment: "" },
  ];

  const columns: DataTableColumn<headersType>[] = [
    {
      accessor: "owner",

      width: "15%",
      render: ({ owner }) => <Title size="md">{owner}</Title>,
    },
    {
      accessor: "description",
      textAlign: "center",
      width: "25%",
    },
    {
      accessor: "expire",
      textAlign: "center",
      width: "20%",
    },
    {
      accessor: "comment",
      textAlign: "center",
      width: "40%",
    },
  ];

  return (
    <DataTable
      horizontalSpacing={"xl"}
      verticalSpacing={"sm"}
      borderRadius={"md"}
      minHeight={"65vh"}
      withTableBorder
      columns={columns}
      records={headers}
      rowExpansion={{
        allowMultiple: true,
        trigger: "always",
        content: (source) => (
          <ScrollArea.Autosize mah={"30vh"} type="auto" offsetScrollbars>
            <DataTable
              highlightOnHover
              noHeader
              horizontalSpacing={"xl"}
              verticalSpacing={"sm"}
              rowBackgroundColor={({ expire }) => {
                if (dayjs().diff(dayjs(expire), "days") <= 7) {
                  return "yellow.3";
                } else {
                  return "red.5";
                }
              }}
              columns={[
                {
                  accessor: "owner",
                  width: "15%",
                  render(record) {
                    return record.employeeId
                      ? `${record.Employee?.firstName} ${record.Employee?.lastName}`
                      : record.Vehicle?.registration;
                  },
                },
                {
                  accessor: "description",
                  textAlign: "center",
                  width: "25%",
                },
                {
                  accessor: "expire",
                  textAlign: "center",
                  width: "20%",
                  render: ({ expire }) => dayjs(expire).format("DD MMM YYYY"),
                },
                {
                  accessor: "comment",
                  textAlign: "center",
                  width: "40%",
                },
              ]}
              records={
                source.record.owner === "Vehicle"
                  ? data.filter((v) => v.vehicleId)
                  : data.filter((e) => e.employeeId)
              }
            />
          </ScrollArea.Autosize>
        ),
      }}
    />
  );
};

export default Main;
