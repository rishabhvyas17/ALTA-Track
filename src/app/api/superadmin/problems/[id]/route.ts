import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateProblemSchema = z.object({
  dayNumber: z.number().min(1).optional(),
  title: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.string().optional(),
  externalLink: z.string().url().optional(),
  articleLink: z.string().url().optional().nullable(),
  videoLink: z.string().url().optional().nullable(),
  companies: z.string().optional().nullable(),
  chapter: z.string().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");

    const { id } = await params;
    const body = await request.json();
    const validated = updateProblemSchema.parse(body);

    const problem = await prisma.problem.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ problem });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error updating problem:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update problem" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");

    const { id } = await params;

    await prisma.problem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error deleting problem:", error);
    return NextResponse.json(
      { error: "Failed to delete problem" },
      { status: 500 }
    );
  }
}
