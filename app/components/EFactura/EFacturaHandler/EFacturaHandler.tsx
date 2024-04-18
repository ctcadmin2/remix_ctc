import { Menu } from "@mantine/core";
import type { $Enums } from "@prisma/client";
import { useFetcher } from "@remix-run/react";

import type { Invoice } from "~/routes/invoices._index";

import EFacturaStatus from "../EFacturaStatus/EFacturaStatus";

const EFacturaHandler = ({ invoice }: { invoice: Invoice }): JSX.Element => {
  const efactura = useFetcher({ key: "efactura" });

  const handleEFactura = (id: number, status: $Enums.eStatus | undefined) => {
    if (!status || status === "store") {
      return;
    }

    if (status === undefined || status === "nproc" || status === "validated") {
      console.log("post");
      return efactura.submit({ id }, { action: "/efactura", method: "POST" });
    }
    console.log("get");
    return efactura.submit({ id }, { action: "/efactura" });
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
