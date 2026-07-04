"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  "CONDITION",
  "ALLERGY",
  "MEDICATION",
  "SENSITIVITY",
  "NEED",
  "CONCERN",
] as const;

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Please enter a name").max(120),
  pronouns: z.string().trim().max(60).optional(),
  dateOfBirth: z.string().trim().max(40).optional(),
  emergencyContact: z.string().trim().max(200).optional(),
  communicationNotes: z.string().trim().max(2000).optional(),
});

export async function saveProfile(formData: FormData) {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    pronouns: formData.get("pronouns") || undefined,
    dateOfBirth: formData.get("dateOfBirth") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
    communicationNotes: formData.get("communicationNotes") || undefined,
  });
  if (!parsed.success) return;

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...parsed.data },
    update: parsed.data,
  });
  revalidatePath("/dashboard");
}

const itemSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().trim().min(1).max(200),
  details: z.string().trim().max(2000).optional(),
  severity: z.string().trim().max(40).optional(),
});

export async function addCareItem(formData: FormData) {
  const userId = await requireUserId();
  const parsed = itemSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    details: formData.get("details") || undefined,
    severity: formData.get("severity") || undefined,
  });
  if (!parsed.success) return;

  await prisma.careItem.create({ data: { userId, ...parsed.data } });
  revalidatePath("/dashboard");
}

export async function deleteCareItem(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  // Scope the delete to the current user so one user can't delete another's item.
  await prisma.careItem.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
