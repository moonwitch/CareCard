import { NextResponse } from "next/server";
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 500 }
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
    const content = await generateAppointmentDoc({
      profile,
      items,
      appointment: parsed.data.appointment,
    });

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
    console.error("Failed to generate document", err);
    return NextResponse.json(
      { error: "Could not generate the document. Please try again." },
      { status: 502 }
    );
  }
}
