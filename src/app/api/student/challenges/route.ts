import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireRole("STUDENT");

    // Get active challenges
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { problems: true, enrollments: true } },
      },
      orderBy: { name: "asc" },
    });

    // Get current student's completed challenge IDs
    const userEnrollments = await prisma.enrollment.findMany({
      where: { userId: auth.userId },
      select: {
        challengeId: true,
        status: true,
      },
    });

    const completedChallengeIds = userEnrollments
      .filter((e) => e.status === "COMPLETED")
      .map((e) => e.challengeId);

    const activeEnrollment = userEnrollments.find(
      (e) => e.status === "ACTIVE"
    );

    // Map challenges with unlocked state
    const mapped = challenges.map((c) => {
      const isEnrolled = userEnrollments.some((e) => e.challengeId === c.id);
      const isCompleted = completedChallengeIds.includes(c.id);

      let isUnlocked = true;
      if (c.requiresCompletedChallengeId) {
        isUnlocked = completedChallengeIds.includes(
          c.requiresCompletedChallengeId
        );
      }

      return {
        ...c,
        isEnrolled,
        isCompleted,
        isUnlocked,
      };
    });

    return NextResponse.json({
      challenges: mapped,
      activeEnrollmentChallengeId: activeEnrollment?.challengeId || null,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching student challenges:", error);
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}
