import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const auth = await requireRole("STUDENT");

    // Fetch active challenges from cache and user enrollments/student in parallel
    const [challenges, userEnrollments, student] = await Promise.all([
      memoryCache.getOrSet("all_system_challenges", CACHE_TTL.CHALLENGES, () =>
        prisma.challenge.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { problems: true, enrollments: true } },
          },
          orderBy: { name: "asc" },
        })
      ),
      prisma.enrollment.findMany({
        where: { userId: auth.userId },
        select: {
          challengeId: true,
          status: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { year: true, campusId: true },
      }),
    ]);

    const completedChallengeIds = userEnrollments
      .filter((e) => e.status === "COMPLETED")
      .map((e) => e.challengeId);

    const activeEnrollment = userEnrollments.find(
      (e) => e.status === "ACTIVE"
    );

    // Map challenges with unlocked & eligibility state
    const mapped = challenges.map((c) => {
      const isEnrolled = userEnrollments.some((e) => e.challengeId === c.id);
      const isCompleted = completedChallengeIds.includes(c.id);

      let isUnlocked = true;
      if (c.requiresCompletedChallengeId) {
        isUnlocked = completedChallengeIds.includes(
          c.requiresCompletedChallengeId
        );
      }

      const eligibleYears = Array.isArray(c.eligibleYears)
        ? (c.eligibleYears as number[])
        : null;
      const eligibleCampusIds = Array.isArray(c.eligibleCampusIds)
        ? (c.eligibleCampusIds as string[])
        : null;

      let isEligible = true;
      let ineligibilityReason: string | null = null;

      if (eligibleYears && eligibleYears.length > 0 && student?.year) {
        if (!eligibleYears.includes(student.year)) {
          isEligible = false;
          ineligibilityReason = `Eligible for Year ${eligibleYears.join(", ")} only`;
        }
      }

      if (eligibleCampusIds && eligibleCampusIds.length > 0 && student?.campusId) {
        if (!eligibleCampusIds.includes(student.campusId)) {
          isEligible = false;
          ineligibilityReason = ineligibilityReason
            ? `${ineligibilityReason} (Designated campuses only)`
            : "Designated partner campuses only";
        }
      }

      return {
        ...c,
        isEnrolled,
        isCompleted,
        isUnlocked,
        isEligible,
        ineligibilityReason,
      };
    });

    return NextResponse.json(
      {
        challenges: mapped,
        activeEnrollmentChallengeId: activeEnrollment?.challengeId || null,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
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
