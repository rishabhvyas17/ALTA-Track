import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const submitSchema = z.object({
  enrollmentId: z.string().min(1),
  dayNumber: z.number().min(1),
  problemId: z.string().min(1),
  linkedinPostUrl: z.string().url("Must be a valid LinkedIn URL"),
  supportingLink: z.string().url("Must be a valid code screenshot or link URL").optional().or(z.literal("")),
  githubLink: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    const body = await request.json();
    const validated = submitSchema.parse(body);

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
          linkedinPostUrl: validated.linkedinPostUrl,
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
          enrollmentId: validated.enrollmentId,
          dayNumber: validated.dayNumber,
          problemId: validated.problemId,
          linkedinPostUrl: validated.linkedinPostUrl,
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
            : enrollment.currentDay + 1,
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
