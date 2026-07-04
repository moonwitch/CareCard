// Shared display metadata for care item categories.
export const CATEGORY_META: Record<
  string,
  { label: string; hint: string }
> = {
  CONDITION: { label: "Medical conditions", hint: "e.g. asthma, ADHD, chronic pain" },
  ALLERGY: { label: "Allergies & reactions", hint: "e.g. penicillin, latex, peanuts" },
  MEDICATION: { label: "Medications", hint: "e.g. sertraline 50mg daily" },
  SENSITIVITY: {
    label: "Sensory sensitivities",
    hint: "e.g. bright lights, loud rooms, being touched unexpectedly",
  },
  NEED: {
    label: "Support I need",
    hint: "e.g. extra time to answer, written summary, a quiet waiting area",
  },
  CONCERN: {
    label: "Concerns to raise",
    hint: "e.g. trouble sleeping for the last month",
  },
};

export const CATEGORY_ORDER = [
  "CONDITION",
  "ALLERGY",
  "MEDICATION",
  "SENSITIVITY",
  "NEED",
  "CONCERN",
] as const;
