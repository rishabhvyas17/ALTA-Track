import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";

export async function GET() {
  try {
    // Fetch active challenges / tracks
    const rawChallenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        _count: {
          select: { problems: true, enrollments: true },
        },
      },
    });

    const tracks = rawChallenges.map((c) => ({
      id: c.id,
      title: c.name,
      slug: c.slug,
      totalDays: c.totalDays,
      problemsCount: c._count.problems,
      enrollmentsCount: c._count.enrollments,
    }));

    // Fetch active enrollments for leaderboard
    const topEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            campus: {
              select: { name: true },
            },
          },
        },
        submissions: {
          where: { status: "APPROVED" },
          select: {
            problem: {
              select: { difficulty: true },
            },
          },
        },
      },
    });

    // Group enrollments by student user ID to ensure each student appears at most once
    const bestByStudent = new Map<
      string,
      {
        id: string;
        name: string;
        streakCount: number;
        totalScore: number;
        questionsSolved: number;
        campus: { name: string } | null;
      }
    >();

    for (const e of topEnrollments) {
      const scoreData = calculateScore(e.submissions);
      const studentId = e.user.id;
      const existing = bestByStudent.get(studentId);

      const candidate = {
        id: e.user.id,
        name: e.user.name,
        streakCount: e.streakCount,
        totalScore: scoreData.score,
        questionsSolved: scoreData.questionsSolved,
        campus: e.user.campus,
      };

      if (
        !existing ||
        candidate.totalScore > existing.totalScore ||
        (candidate.totalScore === existing.totalScore && candidate.streakCount > existing.streakCount) ||
        (candidate.totalScore === existing.totalScore &&
          candidate.streakCount === existing.streakCount &&
          candidate.questionsSolved > existing.questionsSolved)
      ) {
        bestByStudent.set(studentId, candidate);
      }
    }

    const leaderboard = Array.from(bestByStudent.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.streakCount - a.streakCount;
      })
      .slice(0, 5);

    return NextResponse.json({
      tracks,
      leaderboard,
    });
  } catch (error) {
    console.error("Landing API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch landing data" },
      { status: 500 }
    );
  }
}
