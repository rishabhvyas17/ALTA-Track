import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const createProblemSchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1, "Title is required"),
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  externalLink: z.string().url("Must be a valid URL"),
});

const reorderSchema = z.object({
  problems: z.array(
    z.object({
      id: z.string(),
      dayNumber: z.number().int().min(1),
    })
  ),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id: challengeId } = await params;

    const problems = await prisma.problem.findMany({
      where: { challengeId },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({ problems });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id: challengeId } = await params;

    const body = await request.json();

    // Handle reorder
    if (body.action === "reorder") {
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      // Update all day numbers in a transaction
      await prisma.$transaction(
        parsed.data.problems.map((p) =>
          prisma.problem.update({
            where: { id: p.id },
            data: { dayNumber: p.dayNumber },
          })
        )
      );

      return NextResponse.json({ message: "Problems reordered" });
    }

    // Create new problem
    const parsed = createProblemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Check day number uniqueness
    const existing = await prisma.problem.findUnique({
      where: {
        challengeId_dayNumber: {
          challengeId,
          dayNumber: parsed.data.dayNumber,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Day ${parsed.data.dayNumber} already has a problem assigned` },
        { status: 409 }
      );
    }

    const problem = await prisma.problem.create({
      data: {
        ...parsed.data,
        challengeId,
      },
    });

    return NextResponse.json({ problem }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
