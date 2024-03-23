import { Select } from "@mantine/core";
import type { Prisma } from "@prisma/client";

export type VehiclesListType = Prisma.VehicleGetPayload<{
  select: {
    id: true;
    registration: true;
  };
}>;

const VehiclesList = ({
  vehicles,
  value,
  onChange,
}: {
  vehicles: VehiclesListType[] | null;
  value?: string;
  onChange: (value: string | null) => void;
}) => {
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
          ? vehicles.map((vehicle: VehiclesListType) => {
              return {
                label: String(vehicle.registration),
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
