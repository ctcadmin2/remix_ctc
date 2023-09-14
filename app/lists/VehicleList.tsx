import { Select } from "@mantine/core";
import type { Vehicle } from "@prisma/client";
import { useLoaderData } from "@remix-run/react";

const VehiclesList = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string | null) => void;
}) => {
  const { vehicles } = useLoaderData();
  return (
    <Select
      label="Vehicle"
      name="vehicleId"
      placeholder={vehicles ? "Pick one" : "No options"}
      disabled={vehicles ? false : true}
      allowDeselect
      clearable
      searchable
      data={
        vehicles
          ? vehicles.map((vehicle: Vehicle) => {
              return {
                label: vehicle.registration,
                value: String(vehicle.id),
              };
            })
          : []
      }
      value={String(value)}
      onChange={onChange}
    />
  );
};

export default VehiclesList;
