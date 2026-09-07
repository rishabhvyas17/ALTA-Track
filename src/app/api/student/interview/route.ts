import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const interviewSchema = z.object({
  challengeId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    const body = await request.json();
    const { challengeId, notes } = interviewSchema.parse(body);

    // Check enrollment & streak eligibility
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: auth.userId,
        challengeId,
      },
      include: { challenge: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this challenge" },
        { status: 400 }
      );
    }

    // Check if all problems in challenge are completed
    const allProblems = await prisma.problem.findMany({
      where: { challengeId },
      select: { id: true },
    });
    const approvedSubmissions = await prisma.submission.findMany({
      where: {
        enrollmentId: enrollment.id,
        status: "APPROVED",
      },
      select: { problemId: true },
    });
    const approvedProblemIds = new Set(approvedSubmissions.map((s) => s.problemId));
    const allProblemsSolved = allProblems.length > 0 && approvedProblemIds.size >= allProblems.length;

    if (!allProblemsSolved) {
      return NextResponse.json(
        {
          error: `You must complete all ${allProblems.length} problems in this sheet before applying for tech interviews. Current approved: ${approvedProblemIds.size}/${allProblems.length}`,
        },
        { status: 400 }
      );
    }

    // Create interview application
    const application = await prisma.interviewApplication.create({
      data: {
        userId: auth.userId,
        challengeId,
        notes: notes || "Applied via ALTA-Track Dashboard",
        status: "QUEUED",
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error applying for interview:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to apply for interview" },
      { status: 500 }
    );
  }
}
