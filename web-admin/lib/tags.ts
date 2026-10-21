export type Tag =
  | "animal_welfare"
  | "donations"
  | "education"
  | "funders_and_grants"
  | "humanitarian_aid"
  | "innovation";

export const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: "animal_welfare", label: "Animal Welfare Team" },
  { value: "donations", label: "Donations Team" },
  { value: "education", label: "Education Team" },
  { value: "funders_and_grants", label: "Funders and Grants Team" },
  { value: "humanitarian_aid", label: "Humanitarian Aid Team" },
  { value: "innovation", label: "Innovation Team" },
];

const TAG_LABELS: Record<string, string> = Object.fromEntries(
  TAG_OPTIONS.map((option) => [option.value, option.label])
);

export function tagLabel(tag: string | null): string | null {
  if (!tag) return null;
  return TAG_LABELS[tag] ?? tag;
}
