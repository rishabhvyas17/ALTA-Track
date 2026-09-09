import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("CAMPUS_ADMIN", "SUPER_ADMIN");
    const { id: studentId } = await params;

    const student = await prisma.user.findUnique({
      where: { id: studentId, role: "STUDENT" },
      include: {
        campus: {
          select: { id: true, name: true, region: true },
        },
        enrollments: {
          include: {
            challenge: {
              select: { id: true, name: true, slug: true, totalDays: true },
            },
            submissions: {
              include: {
                problem: {
                  select: {
                    id: true,
                    title: true,
                    difficulty: true,
                    topic: true,
                    chapter: true,
                    externalLink: true,
                  },
                },
              },
              orderBy: { submittedAt: "desc" },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Role-based scoping: Campus Admins can only view students of their campus (and assigned year)
    if (auth.role === "CAMPUS_ADMIN") {
      if (student.campusId !== auth.campusId) {
        return NextResponse.json(
          { error: "Unauthorized to view students outside your campus." },
          { status: 403 }
        );
      }

      const adminUser = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { year: true },
      });

      if (adminUser?.year && student.year !== adminUser.year) {
        return NextResponse.json(
          {
            error: `You are assigned to Year ${adminUser.year} students only.`,
          },
          { status: 403 }
        );
      }
    }

    // Flatten all submissions from all enrolled sheets
    const allSubmissions = student.enrollments.flatMap((e) =>
      e.submissions.map((s) => ({
        id: s.id,
        dayNumber: s.dayNumber,
        challengeId: e.challenge.id,
        challengeName: e.challenge.name,
        problemId: s.problem.id,
        problemTitle: s.problem.title,
        difficulty: s.problem.difficulty,
        topic: s.problem.topic,
        chapter: s.problem.chapter,
        externalLink: s.problem.externalLink,
        status: s.status,
        submittedAt: s.submittedAt,
        rejectionReason: s.rejectionReason,
        linkedinPostUrl: s.linkedinPostUrl,
        githubLink: s.githubLink,
        supportingLink: s.supportingLink,
      }))
    );

    // Sort submissions by submittedAt desc
    allSubmissions.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    const approvedCount = allSubmissions.filter((s) => s.status === "APPROVED").length;
    const pendingCount = allSubmissions.filter((s) => s.status === "PENDING").length;
    const rejectedCount = allSubmissions.filter((s) => s.status === "REJECTED").length;

    const easyCount = allSubmissions.filter(
      (s) => s.difficulty?.toUpperCase() === "EASY"
    ).length;
    const mediumCount = allSubmissions.filter(
      (s) => s.difficulty?.toUpperCase() === "MEDIUM"
    ).length;
    const hardCount = allSubmissions.filter(
      (s) => s.difficulty?.toUpperCase() === "HARD"
    ).length;

    const streakList = student.enrollments.map((e) => e.streakCount);
    const longestStreakList = student.enrollments.map((e) => e.longestStreak);

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        year: student.year,
        campus: student.campus,
        createdAt: student.createdAt,
      },
      stats: {
        totalAttempted: allSubmissions.length,
        approvedCount,
        pendingCount,
        rejectedCount,
        easyCount,
        mediumCount,
        hardCount,
        activeStreak: streakList.length > 0 ? Math.max(...streakList) : 0,
        longestStreak: longestStreakList.length > 0 ? Math.max(...longestStreakList) : 0,
      },
      enrollments: student.enrollments.map((e) => ({
        id: e.id,
        challengeName: e.challenge.name,
        totalDays: e.challenge.totalDays,
        currentDay: e.currentDay,
        streakCount: e.streakCount,
        longestStreak: e.longestStreak,
        status: e.status,
      })),
      submissions: allSubmissions,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Error fetching student details:", error);
    return NextResponse.json(
      { error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}
