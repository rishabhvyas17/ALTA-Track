import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseRules } from "@/lib/rules";
import { memoryCache } from "@/lib/cache";
import { z } from "zod";

function normalizeUrl(url: any): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const submitSchema = z
  .object({
    enrollmentId: z.string().min(1, "Enrollment ID is required"),
    dayNumber: z.number().min(1, "Day number must be at least 1"),
    problemId: z.string().min(1, "Problem ID is required"),
    linkedinPostUrl: z
      .string()
      .url("Must be a valid LinkedIn post URL")
      .optional()
      .or(z.literal(""))
      .nullable(),
    supportingLink: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal(""))
      .nullable(),
    githubLink: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal(""))
      .nullable(),
  })
  .refine(
    (data) => {
      const hasLinkedIn =
        typeof data.linkedinPostUrl === "string" &&
        data.linkedinPostUrl.trim().length > 0;
      const hasGithub =
        typeof data.githubLink === "string" &&
        data.githubLink.trim().length > 0;
      return hasLinkedIn || hasGithub;
    },
    {
      message:
        "Please provide at least one proof link: either a LinkedIn post URL or a GitHub code repository URL.",
      path: ["linkedinPostUrl"],
    }
  );

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    const body = await request.json();

    // Normalize URLs before validation so students can type 'linkedin.com/...' or 'github.com/...'
    const normalizedBody = {
      ...body,
      linkedinPostUrl: normalizeUrl(body.linkedinPostUrl) || "",
      githubLink: normalizeUrl(body.githubLink) || "",
      supportingLink: normalizeUrl(body.supportingLink) || "",
    };

    const validated = submitSchema.parse(normalizedBody);

    // Fetch enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: validated.enrollmentId },
      include: { challenge: true },
    });

    if (!enrollment || enrollment.userId !== auth.userId) {
      return NextResponse.json(
        { error: "Enrollment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if the student has already submitted ANY problem today in this enrollment
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const alreadySubmittedToday = await prisma.submission.findFirst({
      where: {
        enrollmentId: validated.enrollmentId,
        submittedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const isFirstSubmissionToday = !alreadySubmittedToday;

    // Check if already submitted for this specific day problem
    const existingSubmission = await prisma.submission.findUnique({
      where: {
        enrollmentId_dayNumber: {
          enrollmentId: validated.enrollmentId,
          dayNumber: validated.dayNumber,
        },
      },
    });

    let submission;

    if (existingSubmission) {
      // Re-submit if rejected or pending
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          linkedinPostUrl: validated.linkedinPostUrl || null,
          supportingLink: validated.supportingLink || null,
          githubLink: validated.githubLink || null,
          status: "PENDING",
          rejectionReason: null,
          submittedAt: new Date(),
        },
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          enrollment: { connect: { id: validated.enrollmentId } },
          problem: { connect: { id: validated.problemId } },
          dayNumber: validated.dayNumber,
          linkedinPostUrl: validated.linkedinPostUrl || null,
          supportingLink: validated.supportingLink || null,
          githubLink: validated.githubLink || null,
          status: "PENDING",
        },
      });

      // Streaks increase strictly on the basis of calendar days.
      // If student already submitted a problem today, streak count does not increase again.
      let newStreak = enrollment.streakCount;
      let graceDaysUsed = enrollment.graceDaysUsedThisMonth;
      let status = enrollment.status;

      if (isFirstSubmissionToday) {
        // Find most recent submission before today
        const lastSubmissionBeforeToday = await prisma.submission.findFirst({
          where: {
            enrollmentId: validated.enrollmentId,
            id: { not: submission.id },
            submittedAt: { lt: startOfToday },
          },
          orderBy: { submittedAt: "desc" },
        });

        if (!lastSubmissionBeforeToday) {
          // First submission ever for this challenge track
          newStreak = 1;
          status = "ACTIVE";
        } else {
          const prevDate = new Date(lastSubmissionBeforeToday.submittedAt);
          prevDate.setHours(0, 0, 0, 0);
          const diffMs = startOfToday.getTime() - prevDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Consecutive day
            newStreak = (enrollment.streakCount > 0 ? enrollment.streakCount : 0) + 1;
            status = "ACTIVE";
          } else {
            // Gap of missed days
            const rules = parseRules(enrollment.challenge.rules);
            const missedDays = diffDays - 1;
            const availableGrace = Math.max(0, rules.graceDaysPerMonth - enrollment.graceDaysUsedThisMonth);

            if (missedDays <= availableGrace && enrollment.status !== "BROKEN") {
              graceDaysUsed += missedDays;
              newStreak = (enrollment.streakCount > 0 ? enrollment.streakCount : 0) + 1;
              status = "ACTIVE";
            } else {
              // Grace days exhausted, streak restarts from 1
              newStreak = 1;
              status = "ACTIVE";
            }
          }
        }
      }

      const newLongest = Math.max(enrollment.longestStreak, newStreak);
      const isChallengeCompleted = validated.dayNumber >= enrollment.challenge.totalDays;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          streakCount: newStreak,
          longestStreak: newLongest,
          graceDaysUsedThisMonth: graceDaysUsed,
          currentDay: isChallengeCompleted
            ? enrollment.currentDay
            : Math.max(enrollment.currentDay, validated.dayNumber + 1),
          status: isChallengeCompleted ? "COMPLETED" : status,
          completedAt: isChallengeCompleted ? new Date() : null,
        },
      });
    }

    // Invalidate dashboard stats caches so new submissions reflect immediately
    memoryCache.deleteByPrefix("admin_stats_");
    memoryCache.delete("superadmin_stats");
    memoryCache.deleteByPrefix("superadmin_students_");
    memoryCache.deleteByPrefix("leaderboard_");

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error submitting solution:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit solution" },
      { status: 500 }
    );
  }
}
