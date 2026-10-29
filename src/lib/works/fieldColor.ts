export interface FieldColor {
  bg: string;
  fg: string;
}

export const FIELD_PALETTE: readonly FieldColor[] = [
  { bg: "#E9EEFF", fg: "#2741B0" },
  { bg: "#E6F6EE", fg: "#17663F" },
  { bg: "#FFF1E3", fg: "#9A4A0B" },
  { bg: "#F5E9FF", fg: "#6B2BA8" },
  { bg: "#E5F5F8", fg: "#126574" },
  { bg: "#FDE9EE", fg: "#A3244A" },
];

export function fieldColor(field: string | undefined): FieldColor {
  if (!field) return FIELD_PALETTE[0]!;
  let hash = 5381;
  for (const char of field) {
    hash = ((hash << 5) + hash + char.codePointAt(0)!) >>> 0;
  }
  return FIELD_PALETTE[hash % FIELD_PALETTE.length]!;
}
