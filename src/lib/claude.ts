import Anthropic from "@anthropic-ai/sdk";

// Bring-your-own-key: the user supplies their own Anthropic API key. It is sent
// with the request and used transiently here — never stored on the server or in
// the database. This module is server-only so the key isn't bundled to the client.
export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export type CareData = {
  profile: {
    displayName: string;
    pronouns?: string | null;
    dateOfBirth?: string | null;
    communicationNotes?: string | null;
  } | null;
  items: {
    category: string;
    title: string;
    details?: string | null;
    severity?: string | null;
  }[];
  appointment?: string | null;
};

const SYSTEM_PROMPT = `You are helping a person — who may be neurodivergent or otherwise find it hard to \
vocalize their needs in the moment — prepare a clear, calm one-page document to hand to a medical or \
care professional at an appointment.

Write in the FIRST PERSON, as the person themselves, using plain, direct language. \
The goal is to help the professional quickly understand this person's situation, communication \
preferences, and what support they need.

Output GitHub-flavored Markdown with these sections (omit a section only if there is genuinely no \
relevant information for it):

1. A short heading with the person's name.
2. "How I communicate best" — communication and sensory preferences that will make the appointment go well.
3. "What I'd like to talk about today" — the concerns/reason for this appointment, if given.
4. "My medical conditions" — conditions/diagnoses.
5. "Allergies & reactions".
6. "Medications I take".
7. "Sensory sensitivities".
8. "Support I need" — accommodations and needs.

Rules:
- Do NOT invent medical facts, diagnoses, doses, or advice. Only use what the person provided.
- Do NOT give medical recommendations or a diagnosis — this document only conveys the person's own information.
- Keep it concise and scannable (bullet points where helpful). Aim for something that fits on one page.
- Use a warm, matter-of-fact tone. Avoid jargon.`;

function buildUserMessage(data: CareData): string {
  const lines: string[] = [];
  const p = data.profile;
  lines.push("Here is the information I've recorded about myself.\n");
  lines.push("## Profile");
  lines.push(`- Name: ${p?.displayName ?? "(not provided)"}`);
  if (p?.pronouns) lines.push(`- Pronouns: ${p.pronouns}`);
  if (p?.dateOfBirth) lines.push(`- Date of birth: ${p.dateOfBirth}`);
  if (p?.communicationNotes)
    lines.push(`- How I communicate best: ${p.communicationNotes}`);

  if (data.appointment) {
    lines.push("\n## This appointment");
    lines.push(data.appointment);
  }

  const byCategory = (cat: string) =>
    data.items.filter((i) => i.category === cat);

  const sections: [string, string][] = [
    ["CONDITION", "Medical conditions"],
    ["ALLERGY", "Allergies & reactions"],
    ["MEDICATION", "Medications"],
    ["SENSITIVITY", "Sensory sensitivities"],
    ["NEED", "Support needs"],
    ["CONCERN", "Concerns to raise"],
  ];

  for (const [cat, label] of sections) {
    const items = byCategory(cat);
    if (items.length === 0) continue;
    lines.push(`\n## ${label}`);
    for (const item of items) {
      const bits = [item.title];
      if (item.severity) bits.push(`(${item.severity})`);
      if (item.details) bits.push(`— ${item.details}`);
      lines.push(`- ${bits.join(" ")}`);
    }
  }

  lines.push(
    "\nPlease turn this into the one-page document described in your instructions."
  );
  return lines.join("\n");
}

export async function generateAppointmentDoc(
  data: CareData,
  apiKey: string
): Promise<string> {
  // Construct a client per request from the user's own key; nothing persists.
  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(data) }],
  });

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}
