import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Fetch active enrollments with highest streak for leaderboard
    const topEnrollments = await prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        streakCount: "desc",
      },
      take: 5,
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
      },
    });

    const leaderboard = topEnrollments.map((e) => ({
      id: e.user.id,
      name: e.user.name,
      streakCount: e.streakCount,
      campus: e.user.campus,
    }));

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
