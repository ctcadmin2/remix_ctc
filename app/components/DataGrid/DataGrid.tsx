import { Stack } from "@mantine/core";
import { useSearchParams } from "@remix-run/react";
import type { DataTableColumn, DataTableSortStatus } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import { useEffect, useRef, useState } from "react";


import NewPageButton from "../NewPageButton/NewPageButton";


interface Props {
  data: unknown[];
  columns: DataTableColumn<unknown>[];
  total: number;
  perPage: number;
}

const DataGrid = ({ data, columns, total, perPage }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get("sort");
  const didMountRef = useRef(false);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>(() => {
    if (sort && sort.split("-").length > 0) {
      const sortParams = sort.split("-");
      return {
        columnAccessor: sortParams[0],
        direction: sortParams[1] as "asc" | "desc",
      };
    }
    return {
      columnAccessor: undefined as unknown as string,
      direction: undefined as unknown as "asc" | "desc",
    };
  });

  useEffect(() => {
    if (didMountRef.current && sortStatus.columnAccessor !== undefined) {
      searchParams.set(
        "sort",
        `${sortStatus.columnAccessor}-${sortStatus.direction}`
      );
      setSearchParams(searchParams);
    }
    didMountRef.current = true;
  }, [searchParams, setSearchParams, sortStatus]);

  return (
    <DataTable
      striped
      highlightOnHover
      // withBorder
      // minHeight={550}
      horizontalSpacing={"xl"}
      verticalSpacing={"sm"}
      borderRadius={"md"}
      minHeight={"65vh"}
      records={data}
      columns={columns}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      page={parseInt(searchParams.get("page") || "1")}
      onPageChange={(page) => setSearchParams({ page: String(page) })}
      totalRecords={total}
      recordsPerPage={perPage}
      paginationText={() => <NewPageButton />}
      emptyState={
        <Stack align="center" gap="xs" style={{ pointerEvents: "all" }}>
          <NewPageButton />
        </Stack>
      }
    />
  );
};

export default DataGrid;
