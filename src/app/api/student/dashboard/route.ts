import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { renderRulesAsPlainText, parseRules } from "@/lib/rules";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    // Fetch student active enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: auth.userId,
        status: "ACTIVE",
      },
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
      return NextResponse.json({ enrollment: null });
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

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
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
        totalDays: challenge.totalDays,
        rules: challenge.rules,
        rulesFormatted: plainTextRules,
        template: challenge.linkedInPostTemplates[0] || null,
      },
      currentProblem,
      todaySubmission: todaySubmission || null,
      submissions: enrollment.submissions,
      interviewApp: interviewApp || null,
      goodiesClaim: goodiesClaim || null,
      isEligibleForInterview,
      isEligibleForGoodies,
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
