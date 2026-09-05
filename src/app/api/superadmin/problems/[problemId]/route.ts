import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateProblemSchema = z.object({
  dayNumber: z.number().int().min(1).optional(),
  title: z.string().min(1).optional(),
  topic: z.string().min(1).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  externalLink: z.string().url().optional(),
});

type RouteParams = { params: Promise<{ problemId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { problemId } = await params;

    const body = await request.json();
    const parsed = updateProblemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Check day number uniqueness if changed
    if (
      parsed.data.dayNumber &&
      parsed.data.dayNumber !== existing.dayNumber
    ) {
      const duplicate = await prisma.problem.findUnique({
        where: {
          challengeId_dayNumber: {
            challengeId: existing.challengeId,
            dayNumber: parsed.data.dayNumber,
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Day ${parsed.data.dayNumber} already has a problem assigned`,
          },
          { status: 409 }
        );
      }
    }

    const problem = await prisma.problem.update({
      where: { id: problemId },
      data: parsed.data,
    });

    return NextResponse.json({ problem });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { problemId } = await params;

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    await prisma.problem.delete({ where: { id: problemId } });

    // Re-number subsequent problems to keep gapless ordering
    await prisma.$executeRaw`
      UPDATE problems 
      SET day_number = day_number - 1 
      WHERE challenge_id = ${problem.challengeId} 
        AND day_number > ${problem.dayNumber}
    `;

    return NextResponse.json({ message: "Problem deleted and reordered" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
