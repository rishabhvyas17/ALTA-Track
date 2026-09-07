import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { renderRulesAsPlainText, parseRules } from "@/lib/rules";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");
    const requestedChallengeId = request.nextUrl.searchParams.get("challengeId");

    // Stage 1: Parallel fetch of student profile, cached campuses, active enrollments, and cached system challenges
    const [student, allCampuses, allUserEnrollments, allSystemChallenges] = await Promise.all([
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          name: true,
          year: true,
          campusId: true,
          campus: { select: { id: true, name: true, region: true } },
        },
      }),
      memoryCache.getOrSet("all_campuses", CACHE_TTL.CAMPUSES, () =>
        prisma.campus.findMany({
          select: { id: true, name: true, region: true },
          orderBy: { name: "asc" },
        })
      ),
      prisma.enrollment.findMany({
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
      }),
      memoryCache.getOrSet("all_system_challenges", CACHE_TTL.CHALLENGES, () =>
        prisma.challenge.findMany({
          where: { isActive: true },
          include: {
            _count: { select: { problems: true, enrollments: true } },
          },
          orderBy: { name: "asc" },
        })
      ),
    ]);

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
      return NextResponse.json(
        {
          enrollment: null,
          student,
          allUserEnrollments: [],
          availableTracks,
          allCampuses,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    // Identify target challenge ID for parallel fetching
    const targetMeta = allUserEnrollments.find((e) => e.id === targetEnrollmentId);
    const targetChallengeId = targetMeta?.challenge?.id || requestedChallengeId;

    // Stage 2: Fetch enrollment details in parallel with cached problem definitions, interview app, and goodies claim
    const [enrollment, allProblems, interviewApp, goodiesClaim] = await Promise.all([
      prisma.enrollment.findUnique({
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
            select: {
              id: true,
              enrollmentId: true,
              dayNumber: true,
              problemId: true,
              linkedinPostUrl: true,
              supportingLink: true,
              githubLink: true,
              status: true,
              reviewedAt: true,
              rejectionReason: true,
              submittedAt: true,
            },
          },
        },
      }),
      targetChallengeId
        ? memoryCache.getOrSet(`challenge_problems_${targetChallengeId}`, CACHE_TTL.PROBLEMS, () =>
            prisma.problem.findMany({
              where: { challengeId: targetChallengeId },
              orderBy: { dayNumber: "asc" },
            })
          )
        : Promise.resolve([]),
      targetChallengeId
        ? prisma.interviewApplication.findFirst({
            where: {
              userId: auth.userId,
              challengeId: targetChallengeId,
            },
            orderBy: { appliedAt: "desc" },
          })
        : Promise.resolve(null),
      targetChallengeId
        ? prisma.goodiesClaim.findFirst({
            where: {
              userId: auth.userId,
              challengeId: targetChallengeId,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!enrollment) {
      return NextResponse.json(
        {
          enrollment: null,
          student,
          allUserEnrollments: [],
          availableTracks,
          allCampuses,
        },
        {
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    const { challenge } = enrollment;

    // Derive current day problem in memory directly from cached problem definitions
    const currentProblem = allProblems.find((p) => p.dayNumber === enrollment.currentDay) || null;

    // Current day submission (if any)
    const todaySubmission = enrollment.submissions.find(
      (s: any) => s.dayNumber === enrollment.currentDay
    );

    // Parse & Render rules as plain text
    const rulesObj = parseRules(challenge.rules);
    const plainTextRules = renderRulesAsPlainText(rulesObj, {
      name: challenge.name,
      totalDays: challenge.totalDays,
    });

    // Eligibility: Interview = all problems solved, Goodies = all solved + interview passed
    const approvedProblemIds = new Set(
      enrollment.submissions
        .filter((s: any) => s.status === "APPROVED")
        .map((s: any) => s.problemId)
    );
    const totalProblemsInChallenge = allProblems.length;
    const allProblemsSolved = totalProblemsInChallenge > 0 && approvedProblemIds.size >= totalProblemsInChallenge;

    const isEligibleForInterview = allProblemsSolved;
    const isEligibleForGoodies = allProblemsSolved && interviewApp?.status === "PASSED";

    return NextResponse.json(
      {
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
    console.error("Error fetching student dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
