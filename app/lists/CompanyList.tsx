import { Select } from "@mantine/core";
import type { Prisma } from "@prisma/client";

import { capitalize } from "~/utils/stringUtils";

export type CompaniesListType = Prisma.CompanyGetPayload<{
  select: {
    id: true;
    name: true;
  };
}>;

interface PropType {
  type: string;
  companies: CompaniesListType[];
  required: boolean;
  value?: string;
  onChange: (value: string | null) => void;
}

const CompanyList = ({
  type,
  companies,
  required,
  value,
  onChange,
}: PropType) => {
  const companyList = () => {
    if (companies) {
      const list = companies.map((company) => {
        return {
          label: company.name,
          value: String(company.id),
        };
      });

      return list;
    }
    return [];
  };

  return (
    <Select
      label={`${capitalize(type)}`}
      name={`${type}Id`}
      placeholder={companies ? "Pick one" : "No options"}
      disabled={!companies}
      allowDeselect
      clearable
      searchable
      required={required}
      data={companyList()}
      value={String(value)}
      onChange={onChange}
    />
  );
};

export default CompanyList;
