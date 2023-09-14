import { Select } from "@mantine/core";
import type { Company } from "@prisma/client";
import { capitalize } from "~/utils/stringUtils";

type PropType = {
  type: string;
  companies: Partial<Company>[];
  value: string;
  onChange: any;
};

const CompanyList = ({ type, companies, value, onChange }: PropType) => {
  return (
    <Select
      label={`${capitalize(type)}`}
      name={`${type}Id`}
      placeholder={companies ? "Pick one" : "No options"}
      disabled={companies ? false : true}
      allowDeselect
      clearable
      searchable
      data={
        companies
          ? companies.map((company) => {
              return {
                label: company.name,
                value: String(company.id),
              };
            })
          : []
      }
      value={value}
      onChange={onChange}
    />
  );
};

export default CompanyList;
