import type { ComboboxItem } from "@mantine/core";

export const CountryCodes = Object.freeze({
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  EL: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  XI: "Northern Ireland",
});

export const CountrySelect = () => {
  const list: ComboboxItem[] = [];

  for (const [key, value] of Object.entries(CountryCodes)) {
    list.push({
      value: key,
      label: value,
    });
  }

  return list;
};
