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

    const leaderboard = topEnrollments
      .map((e) => {
        const scoreData = calculateScore(e.submissions);
        return {
          id: e.user.id,
          name: e.user.name,
          streakCount: e.streakCount,
          totalScore: scoreData.score,
          questionsSolved: scoreData.questionsSolved,
          campus: e.user.campus,
        };
      })
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
