import { ButtonGroup, Divider, Flex, Pagination } from "@mantine/core";
import { useSearchParams } from "@remix-run/react";
import Decimal from "decimal.js";
import type { DataTableColumn, DataTableSortStatus } from "mantine-datatable";
import { DataTable } from "mantine-datatable";
import { type JSX, type ReactNode, useEffect, useRef, useState } from "react";

import NewPageButton from "../NewPageButton/NewPageButton";

interface Props<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  total: number;
  perPage: number;
  extraButton?: ReactNode | undefined;
}

//TODO fix pagination when filtering

function DataGrid<T>({
  data,
  columns,
  total,
  perPage,
  extraButton = undefined,
}: Props<T>): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort");
  const didMountRef = useRef(false);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>(() => {
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
        `${String(sortStatus.columnAccessor)}-${sortStatus.direction}`,
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
        withTableBorder={false}
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
      />
      <Divider orientation="horizontal" my={"lg"} />
      <Flex justify={"space-between"}>
        <ButtonGroup>
          <NewPageButton />
          {extraButton ?? null}
        </ButtonGroup>

        <Pagination
          total={new Decimal(total).dividedBy(perPage).ceil().toNumber()}
          value={Number.parseInt(searchParams.get("page") || "1")}
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
}

export default DataGrid;
