import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { renderRulesAsPlainText, parseRules } from "@/lib/rules";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");
    const requestedChallengeId = request.nextUrl.searchParams.get("challengeId");

    // Fetch student profile (to check year & campus eligibility for tracks)
    const student = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        year: true,
        campusId: true,
        campus: { select: { id: true, name: true, region: true } },
      },
    });

    // Fetch all active campuses for leaderboard filtering
    const allCampuses = await prisma.campus.findMany({
      select: { id: true, name: true, region: true },
      orderBy: { name: "asc" },
    });

    // Fetch all active enrollments for this student
    const allUserEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
      include: {
        challenge: {
          select: {
            id: true,
            name: true,
            slug: true,
            totalDays: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch all active system challenges
    const allSystemChallenges = await prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { problems: true, enrollments: true } },
      },
      orderBy: { name: "asc" },
    });

    // Map challenges with eligibility
    const availableTracks = allSystemChallenges.map((c) => {
      const isEnrolled = allUserEnrollments.some((e) => e.challengeId === c.id);
      const eligibleYears = Array.isArray(c.eligibleYears) ? (c.eligibleYears as number[]) : null;
      const eligibleCampusIds = Array.isArray(c.eligibleCampusIds) ? (c.eligibleCampusIds as string[]) : null;

      let isEligible = true;
      let ineligibilityReason: string | null = null;

      if (eligibleYears && eligibleYears.length > 0 && student?.year) {
        if (!eligibleYears.includes(student.year)) {
          isEligible = false;
          ineligibilityReason = `For Year ${eligibleYears.join(", ")} only`;
        }
      }

      if (eligibleCampusIds && eligibleCampusIds.length > 0 && student?.campusId) {
        if (!eligibleCampusIds.includes(student.campusId)) {
          isEligible = false;
          ineligibilityReason = ineligibilityReason
            ? `${ineligibilityReason} (Designated campuses only)`
            : "Designated campuses only";
        }
      }

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        totalDays: c.totalDays,
        problemsCount: c._count.problems,
        enrollmentsCount: c._count.enrollments,
        isEnrolled,
        isEligible,
        ineligibilityReason,
      };
    });

    // Select the target enrollment to display
    let targetEnrollmentId: string | null = null;
    if (requestedChallengeId) {
      const match = allUserEnrollments.find((e) => e.challengeId === requestedChallengeId);
      if (match) targetEnrollmentId = match.id;
    }

    if (!targetEnrollmentId && allUserEnrollments.length > 0) {
      targetEnrollmentId = allUserEnrollments[0].id;
    }

    if (!targetEnrollmentId) {
      // Not enrolled in any challenge yet
      return NextResponse.json({
        enrollment: null,
        student,
        allUserEnrollments: [],
        availableTracks,
      });
    }

    // Fetch full enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: targetEnrollmentId },
      include: {
        challenge: {
          include: {
            linkedInPostTemplates: {
              where: { isActive: true },
              take: 1,
            },
          },
        },
        submissions: {
          orderBy: { dayNumber: "asc" },
          include: {
            problem: true,
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({
        enrollment: null,
        student,
        allUserEnrollments: [],
        availableTracks,
      });
    }

    const { challenge } = enrollment;

    // Fetch current day problem
    const currentProblem = await prisma.problem.findUnique({
      where: {
        challengeId_dayNumber: {
          challengeId: challenge.id,
          dayNumber: enrollment.currentDay,
        },
      },
    });

    // Fetch current day submission (if any)
    const todaySubmission = enrollment.submissions.find(
      (s: any) => s.dayNumber === enrollment.currentDay
    );

    // Fetch interview application status
    const interviewApp = await prisma.interviewApplication.findFirst({
      where: {
        userId: auth.userId,
        challengeId: challenge.id,
      },
      orderBy: { appliedAt: "desc" },
    });

    // Fetch goodies claim status
    const goodiesClaim = await prisma.goodiesClaim.findFirst({
      where: {
        userId: auth.userId,
        challengeId: challenge.id,
      },
    });

    // Parse & Render rules as plain text
    const rulesObj = parseRules(challenge.rules);
    const plainTextRules = renderRulesAsPlainText(rulesObj, {
      name: challenge.name,
      totalDays: challenge.totalDays,
    });

    const isEligibleForInterview = enrollment.streakCount >= 25;
    const isEligibleForGoodies = enrollment.streakCount >= 30;

    // Fetch all problems for this challenge
    const allProblems = await prisma.problem.findMany({
      where: { challengeId: challenge.id },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({
      student,
      enrollment: {
        id: enrollment.id,
        challengeId: challenge.id,
        currentDay: enrollment.currentDay,
        streakCount: enrollment.streakCount,
        longestStreak: enrollment.longestStreak,
        graceDaysUsedThisMonth: enrollment.graceDaysUsedThisMonth,
        restartCount: enrollment.restartCount,
        status: enrollment.status,
        startDate: enrollment.startDate,
      },
      challenge: {
        id: challenge.id,
        name: challenge.name,
        slug: challenge.slug,
        totalDays: challenge.totalDays,
        rules: challenge.rules,
        rulesFormatted: plainTextRules,
        template: challenge.linkedInPostTemplates[0] || null,
      },
      allUserEnrollments: allUserEnrollments.map((e) => ({
        id: e.id,
        challengeId: e.challenge.id,
        challengeName: e.challenge.name,
        slug: e.challenge.slug,
        totalDays: e.challenge.totalDays,
      })),
      availableTracks,
      currentProblem,
      allProblems,
      todaySubmission: todaySubmission || null,
      submissions: enrollment.submissions,
      interviewApp: interviewApp || null,
      goodiesClaim: goodiesClaim || null,
      isEligibleForInterview,
      isEligibleForGoodies,
      allCampuses,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching student dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
