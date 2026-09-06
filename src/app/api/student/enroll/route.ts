import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const enrollSchema = z.object({
  challengeId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    const body = await request.json();
    const { challengeId } = enrollSchema.parse(body);

    // Verify challenge existence & active status
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || !challenge.isActive) {
      return NextResponse.json(
        { error: "Challenge not found or inactive" },
        { status: 404 }
      );
    }

    // Check student year and campus eligibility
    const student = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { year: true, campusId: true },
    });

    const eligibleYears = Array.isArray(challenge.eligibleYears)
      ? (challenge.eligibleYears as number[])
      : null;
    const eligibleCampusIds = Array.isArray(challenge.eligibleCampusIds)
      ? (challenge.eligibleCampusIds as string[])
      : null;

    if (eligibleYears && eligibleYears.length > 0 && student?.year) {
      if (!eligibleYears.includes(student.year)) {
        return NextResponse.json(
          { error: `This challenge is only open to Year ${eligibleYears.join(", ")} students.` },
          { status: 403 }
        );
      }
    }

    if (eligibleCampusIds && eligibleCampusIds.length > 0 && student?.campusId) {
      if (!eligibleCampusIds.includes(student.campusId)) {
        return NextResponse.json(
          { error: "This challenge is restricted to designated partner campuses." },
          { status: 403 }
        );
      }
    }

    // Check prerequisite requirement
    if (challenge.requiresCompletedChallengeId) {
      const prereqCompleted = await prisma.enrollment.findFirst({
        where: {
          userId: auth.userId,
          challengeId: challenge.requiresCompletedChallengeId,
          status: "COMPLETED",
        },
      });

      if (!prereqCompleted) {
        return NextResponse.json(
          { error: "You must complete the prerequisite challenge first" },
          { status: 400 }
        );
      }
    }

    // Check if already enrolled in this challenge
    const existing = await prisma.enrollment.findUnique({
      where: {
        userId_challengeId: {
          userId: auth.userId,
          challengeId,
        },
      },
    });

    if (existing) {
      if (existing.status !== "ACTIVE") {
        const updated = await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE" },
        });
        return NextResponse.json({ enrollment: updated, message: "Re-activated track" });
      }
      return NextResponse.json({ enrollment: existing, message: "Switched to track" });
    }

    // Create new enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: auth.userId,
        challengeId,
        startDate: new Date(),
        currentDay: 1,
        streakCount: 0,
        longestStreak: 0,
        graceDaysUsedThisMonth: 0,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error enrolling in challenge:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to enroll in challenge" },
      { status: 500 }
    );
  }
}
