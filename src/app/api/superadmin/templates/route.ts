import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const createTemplateSchema = z.object({
  challengeId: z.string().min(1, "Challenge is required"),
  templateText: z.string().min(10, "Template text is required"),
  requiredHashtag: z.string().min(1, "Required hashtag is required"),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const templates = await prisma.linkedInPostTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        challenge: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const template = await prisma.linkedInPostTemplate.create({
      data: {
        ...parsed.data,
        isActive: parsed.data.isActive ?? true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
