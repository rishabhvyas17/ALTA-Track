import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
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
      .url("Must be a valid GitHub URL")
      .optional()
      .or(z.literal(""))
      .nullable(),
  })
  .refine(
    (data) =>
      Boolean(data.linkedinPostUrl && data.linkedinPostUrl.trim().length > 0) ||
      Boolean(data.githubLink && data.githubLink.trim().length > 0) ||
      Boolean(data.supportingLink && data.supportingLink.trim().length > 0),
    {
      message:
        "Please provide either a LinkedIn post link or a GitHub code link as proof.",
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

    // Check if already submitted for this day
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

      // Update enrollment progress
      const newStreak = enrollment.streakCount + 1;
      const newLongest = Math.max(enrollment.longestStreak, newStreak);
      const isChallengeCompleted = validated.dayNumber >= enrollment.challenge.totalDays;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          streakCount: newStreak,
          longestStreak: newLongest,
          currentDay: isChallengeCompleted
            ? enrollment.currentDay
            : Math.max(enrollment.currentDay, validated.dayNumber + 1),
          status: isChallengeCompleted ? "COMPLETED" : "ACTIVE",
          completedAt: isChallengeCompleted ? new Date() : null,
        },
      });
    }

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
