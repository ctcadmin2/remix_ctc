import type { ComboboxItem } from "@mantine/core";

export const RoCountyCodes = Object.freeze({
  "RO-AB": "Alba",
  "RO-AG": "Argeș",
  "RO-AR": "Arad",
  "RO-B": "București",
  "RO-BC": "Bacău",
  "RO-BH": "Bihor",
  "RO-BN": "Bistrița-Năsăud",
  "RO-BR": "Brăila",
  "RO-BT": "Botoșani",
  "RO-BV": "Brașov",
  "RO-BZ": "Buzău",
  "RO-CJ": "Cluj",
  "RO-CL": "Călărași",
  "RO-CS": "Caraș-Severin",
  "RO-CT": "Constanța",
  "RO-CV": "Covasna",
  "RO-DB": "Dâmbovița",
  "RO-DJ": "Dolj",
  "RO-GJ": "Gorj",
  "RO-GL": "Galați",
  "RO-GR": "Giurgiu",
  "RO-HD": "Hunedoara",
  "RO-HR": "Harghita",
  "RO-IF": "Ilfov",
  "RO-IL": "Ialomița",
  "RO-IS": "Iași",
  "RO-MH": "Mehedinți",
  "RO-MM": "Maramureș",
  "RO-MS": "Mureș",
  "RO-NT": "Neamț",
  "RO-OT": "Olt",
  "RO-PH": "Prahova",
  "RO-SB": "Sibiu",
  "RO-SJ": "Sălaj",
  "RO-SM": "Satu Mare",
  "RO-SV": "Suceava",
  "RO-TL": "Tulcea",
  "RO-TM": "Timiș",
  "RO-TR": "Teleorman",
  "RO-VL": "Vâlcea",
  "RO-VN": "Vrancea",
  "RO-VS": "Vaslui",
});

export const RoCountySelect = () => {
  const list: ComboboxItem[] = [];

  for (const [key, value] of Object.entries(RoCountyCodes)) {
    list.push({
      value: key,
      label: value,
    });
  }

  return list;
};
