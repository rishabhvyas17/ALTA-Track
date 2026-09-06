import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateMissedDay } from "@/lib/streak-engine";
import { parseRules } from "@/lib/rules";

export async function GET(request: NextRequest) {
  try {
    // Strict authorization check for Cron (fail closed in production or if CRON_SECRET configured)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (process.env.NODE_ENV === "production" || cronSecret) {
      if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: "Unauthorized cron execution. Valid Bearer CRON_SECRET header required." },
          { status: 401 }
        );
      }
    }

    const today = new Date();
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { status: "ACTIVE" },
      include: {
        challenge: true,
        submissions: {
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    let processedCount = 0;

    for (const enrollment of activeEnrollments) {
      const lastSubmission = enrollment.submissions[0];
      const hasSubmittedToday =
        lastSubmission &&
        new Date(lastSubmission.submittedAt).toDateString() ===
          today.toDateString();

      if (!hasSubmittedToday) {
        const rules = parseRules(enrollment.challenge.rules);
        const updatedState = evaluateMissedDay(enrollment as any, rules, today);

        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            graceDaysUsedThisMonth: updatedState.graceDaysUsedThisMonth,
            graceDaysResetAt: updatedState.graceDaysResetAt,
            currentDay: updatedState.currentDay,
            streakCount: updatedState.streakCount,
            restartCount: updatedState.restartCount,
            status: updatedState.status,
          },
        });
        processedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedEnrollments: processedCount,
      evaluatedAt: today.toISOString(),
    });
  } catch (error) {
    console.error("Error executing streak cron:", error);
    return NextResponse.json(
      { error: "Cron execution failed" },
      { status: 500 }
    );
  }
}
