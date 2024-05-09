import { Menu } from "@mantine/core";
import type { $Enums } from "@prisma/client";
import { useFetcher, useRevalidator } from "@remix-run/react";

import type { Invoice } from "~/routes/invoices._index";

import EFacturaStatus from "../EFacturaStatus/EFacturaStatus";

const EFacturaHandler = ({ invoice }: { invoice: Invoice }): JSX.Element => {
  const fetcher = useFetcher({ key: "efactura" });
  const revalidator = useRevalidator();

  const handleEFactura = async (
    id: number,
    status: $Enums.EStatus | undefined,
  ) => {
    //if efactura is already stored do nothing
    if (status === "store") {
      return;
    }

    if (!status || status === "nproc" || status === "validated") {
      return fetcher.submit({ id }, { action: "/efactura", method: "POST" });
    }

    fetcher.submit({ id }, { action: "/efactura" });
    revalidator.revalidate();
  };

  return (
    <Menu.Item
      onClick={() => handleEFactura(invoice.id, invoice.EFactura?.status)}
    >
      <EFacturaStatus status={invoice.EFactura?.status} />
    </Menu.Item>
  );
};

export default EFacturaHandler;
