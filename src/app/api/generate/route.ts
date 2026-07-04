import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAppointmentDoc, CLAUDE_MODEL } from "@/lib/claude";

const bodySchema = z.object({
  appointment: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Bring-your-own-key: the user's Anthropic key arrives in a header, is used
  // transiently, and is never stored server-side.
  const apiKey = req.headers.get("x-anthropic-key")?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add your Anthropic API key first." },
      { status: 400 }
    );
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = session.user.id;
  const [profile, items] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.careItem.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { error: "Add your profile before generating a document." },
      { status: 400 }
    );
  }

  try {
    const content = await generateAppointmentDoc(
      {
        profile,
        items,
        appointment: parsed.data.appointment,
      },
      apiKey
    );

    const doc = await prisma.appointmentDoc.create({
      data: {
        userId,
        title: parsed.data.appointment?.slice(0, 80) || "Appointment document",
        appointment: parsed.data.appointment,
        content,
        model: CLAUDE_MODEL,
      },
    });

    return NextResponse.json({ id: doc.id, content });
  } catch (err) {
    // Don't log the error object — it can echo request details. Log a bare label.
    console.error("Failed to generate document");
    const status =
      err instanceof Anthropic.APIError ? err.status ?? 502 : 502;
    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "Your Anthropic API key was rejected. Check it and try again." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Could not generate the document. Please try again." },
      { status: 502 }
    );
  }
}
