import { ButtonGroup, Divider, Flex, Pagination, Stack } from "@mantine/core";
import { useSearchParams } from "@remix-run/react";
import Decimal from "decimal.js";
import type { DataTableColumn, DataTableSortStatus } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import { ReactNode, useEffect, useRef, useState } from "react";

import NewPageButton from "../NewPageButton/NewPageButton";

interface Props {
  data: unknown[];
  columns: DataTableColumn<unknown>[];
  total: number;
  perPage: number;
  extraButton?: ReactNode | undefined;
}

const DataGrid = ({
  data,
  columns,
  total,
  perPage,
  extraButton = undefined,
}: Props) => {
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
    <>
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
        totalRecords={total}
        emptyState={
          <Stack align="center" gap="xs" style={{ pointerEvents: "all" }}>
            <NewPageButton />
          </Stack>
        }
      />
      <Divider orientation="horizontal" my={"lg"} />
      <Flex justify={"space-between"}>
        <ButtonGroup>
          <NewPageButton />
          {extraButton ?? null}
        </ButtonGroup>

        <Pagination
          total={new Decimal(total).dividedBy(perPage).ceil().toNumber()}
          value={parseInt(searchParams.get("page") || "1")}
          onChange={(page) =>
            setSearchParams((prev) => {
              prev.set("page", String(page));
              return prev;
            })
          }
        />
      </Flex>
    </>
  );
};

export default DataGrid;
