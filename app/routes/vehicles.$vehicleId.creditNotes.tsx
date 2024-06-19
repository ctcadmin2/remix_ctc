import { env } from "node:process";

import {
  Button,
  Center,
  Divider,
  Menu,
  NumberInput,
  Text,
} from "@mantine/core";
import { useClickOutside, useFocusTrap, useMergedRef } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import type { Prisma } from "@prisma/client";
import {
  Link,
  json,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";
import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
} from "@remix-run/server-runtime";
import Decimal from "decimal.js";
import type { DataTableColumn } from "mantine-datatable";
import { useEffect, useState } from "react";
import { Edit, FileText, MoreHorizontal, Trash2 } from "react-feather";
import { jsonWithError, jsonWithSuccess, jsonWithWarning } from "remix-toast";
import { useAuthenticityToken } from "remix-utils/csrf/react";
import { CSRFError } from "remix-utils/csrf/server";
import { z } from "zod";
import { zx } from "zodix";

import DataGrid from "~/components/DataGrid/DataGrid";
import BooleanIcon from "~/components/DataGrid/utils/BooleanIcon";
import DeleteModal from "~/components/DataGrid/utils/DeleteModal";
import SearchInput from "~/components/DataGrid/utils/SearchInput";
import { csrf } from "~/utils/csrf.server";
import { db } from "~/utils/db.server";
import { sortOrder } from "~/utils/helpers.server";
import { DEFAULT_REDIRECT, authenticator } from "~/utils/session.server";

type TruckCreditNote = Prisma.CreditNoteGetPayload<{
  select: {
    id: true;
    orderNr: true;
    number: true;
    start: true;
    end: true;
    week: true;
    amount: true;
    currency: true;
    notes: true;
    invoiceId: true;
    vehicleId: true;
    attachment: {
      select: {
        id: true;
      };
    };
  };
}>;

interface LoaderData {
  creditNotes: TruckCreditNote[];
  total: number;
  perPage: number;
}

const schema = z
  .discriminatedUnion("_action", [
    z.object({
      _action: z.literal("delete"),
      id: zx.NumAsString,
    }),
    z.object({
      _action: z.literal("inline"),
      id: zx.NumAsString,
      orderNr: zx.NumAsString,
      vehicleId: zx.NumAsString,
    }),
    z.object({
      _action: z.literal("confirm"),
      id: zx.NumAsString,
      orderNr: zx.NumAsString,
    }),
  ])
  .refine(
    async (data) => {
      // verify that ID exists in database
      if (data._action === "inline") {
        const cns = await db.creditNote.findMany({
          where: {
            AND: [{ orderNr: data.orderNr }, { vehicleId: data.vehicleId }],
          },
        });

        return cns.length === 0;
      }
      return true;
    },
    {
      message: "There is another credit note with this order nr.",
      path: ["duplicate"],
    },
  );

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

  const offset = ((page || 1) - 1) * Number.parseInt(env.ITEMS_PER_PAGE);

  const where: object = {
    ...(filter
      ? {
          OR: [
            {
              number: {
                contains: filter,
                mode: "insensitive",
              },
            },
            { start: { contains: filter, mode: "insensitive" } },
            { end: { contains: filter, mode: "insensitive" } },
          ],
        }
      : {}),
    vehicle: { id: vehicleId },
  };

  const data: LoaderData = {
    creditNotes: await db.creditNote.findMany({
      where,
      take: 7,
      skip: offset,
      orderBy: sortOrder({ orderNr: "asc" }, sort),
      select: {
        id: true,
        orderNr: true,
        number: true,
        start: true,
        end: true,
        week: true,
        amount: true,
        currency: true,
        notes: true,
        invoiceId: true,
        vehicleId: true,
        attachment: {
          select: {
            id: true,
          },
        },
      },
    }),
    total: await db.creditNote.count({ where }),
    perPage: Number.parseInt(env.ITEMS_PER_PAGE),
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

  const formPayload = Object.fromEntries(await request.formData());
  const formData = await schema.safeParseAsync(formPayload);

  if (!formData.success) {
    let errors = {};
    formData.error.issues.map((i) => {
      errors = { ...errors, [`${i.path[0]}`]: i.message };
      return;
    });

    return jsonWithWarning(
      { formPayload, errors },
      "Order number already assign.",
    );
  }

  switch (formData.data._action) {
    case "inline":
      try {
        const creditNote = await db.creditNote.update({
          where: { id: formData.data.id },
          data: { orderNr: formData.data.orderNr },
        });
        if (creditNote) {
          return jsonWithSuccess(null, "Credit note updated.");
        }
        return jsonWithError(null, "Credit note could not updated.");
      } catch (error) {
        return jsonWithError(null, `${error}`);
      }
    case "confirm":
      try {
        await db.creditNote.updateMany({
          where: { orderNr: { gte: formData.data.orderNr } },
          data: { orderNr: { increment: 1 } },
        });
        const creditNote = await db.creditNote.update({
          where: { id: formData.data.id },
          data: { orderNr: formData.data.orderNr },
        });
        if (creditNote) {
          return jsonWithSuccess(null, "Credit note updated.");
        }
        return jsonWithError(null, "Credit note could not updated.");
      } catch (error) {
        return jsonWithError(null, `${error}`);
      }
    case "delete":
      try {
        const creditNote = await db.creditNote.delete({
          where: { id: formData.data.id },
        });

        if (creditNote) {
          return jsonWithSuccess(null, "Credit note deleted successfully.");
        }
        return jsonWithError(null, "Credit note could not deleted.");
      } catch (error) {
        return jsonWithError(null, `An error has occured: ${error}`);
      }

    default:
      return jsonWithError(null, "An error has occured.");
  }
};

//TODO fix redirect on update
//TODO add loading spinner

const CreditNotes = () => {
  const { creditNotes, total, perPage } = useLoaderData<typeof loader>();

  const [opened, setOpened] = useState(false);
  const [editableCell, setEditableCell] = useState<Record<number, boolean>>({});
  const [editableCellValue, setEditableCellValue] = useState<
    number | string | undefined
  >("");
  const [creditNote, setCreditNote] = useState<TruckCreditNote>();

  const fetcher = useFetcher<typeof action>({ key: "inlineOrderNr" });
  const csrf = useAuthenticityToken();

  const useClickOutsideRef = useClickOutside(() => {
    fetcher.submit({});
    setEditableCell({});
  });
  const focusTrapRef = useFocusTrap();
  const mergedRef = useMergedRef(useClickOutsideRef, focusTrapRef);

  const navigate = useNavigate();

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data?.formPayload._action === "inline"
    ) {
      openModal();
    }
  });

  const handleDelete = (row: TruckCreditNote) => {
    setCreditNote(row);
    setOpened(!opened);
  };

  const handleInline = (id: number, vehicleId: number | null) => {
    fetcher.submit(
      {
        csrf,
        _action: "inline",
        id,
        orderNr: editableCellValue ?? null,
        vehicleId: vehicleId,
      },
      { method: "POST" },
    );
    setEditableCell({});
    setEditableCellValue(undefined);
  };

  const openModal = () =>
    modals.openConfirmModal({
      title: "Please confirm your action",
      children: (
        <Text size="sm">
          There is another credit note with this order number. Do you want to
          replace it?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => {
        navigate(0);
      },
      onConfirm: () =>
        fetcher.submit(
          { ...fetcher.data.formPayload, _action: "confirm" },
          { method: "POST" },
        ),
    });

  const columns: DataTableColumn<TruckCreditNote>[] = [
    {
      accessor: "orderNr",
      title: "Order Nr.",
      render: (item, index) => {
        if (!editableCell[index]) {
          return (
            <Text
              span
              size="md"
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() => setEditableCell({ [index]: true })}
            >
              {item.orderNr ?? "---"}
            </Text>
          );
        }
        return (
          <NumberInput
            hideControls
            value={editableCellValue}
            onChange={(v) => setEditableCellValue(v)}
            ref={mergedRef}
            onKeyDown={(e) =>
              e.key === "Enter" ? handleInline(item.id, item.vehicleId) : null
            }
          />
        );
      },
    },
    {
      accessor: "number",
      textAlign: "center",
      sortable: true,
    },
    {
      accessor: "start",
      textAlign: "center",
    },
    {
      accessor: "end",
      textAlign: "center",
    },
    {
      accessor: "week",
      textAlign: "center",
    },
    {
      accessor: "value",
      textAlign: "center",
      render: ({ amount, currency }) =>
        Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency,
        }).format(new Decimal(amount).toNumber()),
    },
    {
      accessor: "invoiceId",
      title: "Invoiced",
      textAlign: "center",
      sortable: true,
      render: (record) => {
        return <BooleanIcon value={!!record.invoiceId} />;
      },
    },
    {
      accessor: "notes",
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
                component={Link}
                to={
                  row.attachment === null ? "#" : `/creditNotes/${row.id}.pdf`
                }
                disabled={row.attachment === null}
                reloadDocument
                leftSection={<FileText />}
              >
                PDF
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
                      <Edit size={"16px"} color="teal" strokeWidth={"2px"} />
                    }
                    to={`/creditNotes/${row.id}/edit`}
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
        data={creditNotes}
        columns={columns as DataTableColumn<unknown>[]}
        total={total}
        perPage={perPage}
      />
      <DeleteModal<TruckCreditNote>
        name="credit note"
        title={creditNote?.number}
        opened={opened}
        setOpened={setOpened}
        document={creditNote}
      />
    </>
  );
};

export default CreditNotes;
