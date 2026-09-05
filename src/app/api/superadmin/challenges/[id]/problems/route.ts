import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const createProblemSchema = z.object({
  dayNumber: z.number().min(1),
  title: z.string().min(2),
  topic: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  externalLink: z.string().url("Must be a valid URL (e.g. LeetCode / HackerRank)"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const problems = await prisma.problem.findMany({
      where: { challengeId: id },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({ problems });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");

    const { id } = await params;
    const body = await request.json();
    const validated = createProblemSchema.parse(body);

    // Check duplicate day number
    const existing = await prisma.problem.findUnique({
      where: {
        challengeId_dayNumber: {
          challengeId: id,
          dayNumber: validated.dayNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Problem for Day ${validated.dayNumber} already exists` },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.create({
      data: {
        challengeId: id,
        ...validated,
      },
    });

    return NextResponse.json({ problem }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error creating problem:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create problem" },
      { status: 500 }
    );
  }
}
