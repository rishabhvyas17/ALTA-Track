import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId") || undefined;
    const campusId = searchParams.get("campusId") || undefined;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

    const whereClause: any = {};
    if (challengeId) whereClause.challengeId = challengeId;
    if (campusId) whereClause.user = { ...whereClause.user, campusId };
    if (year) whereClause.user = { ...whereClause.user, year };

    const enrollments = await prisma.enrollment.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            year: true,
            campus: { select: { id: true, name: true, region: true } },
          },
        },
        challenge: {
          select: { id: true, name: true, totalDays: true },
        },
      },
      orderBy: [
        { currentDay: "desc" },
        { streakCount: "desc" },
        { completedAt: "asc" },
        { updatedAt: "asc" },
      ],
    });

    // Grouping stats for campus-wise leaderboard view
    const campusAggregates: Record<string, { id: string; name: string; totalStreak: number; studentCount: number }> = {};

    enrollments.forEach((e) => {
      if (e.user.campus) {
        const cId = e.user.campus.id;
        if (!campusAggregates[cId]) {
          campusAggregates[cId] = {
            id: cId,
            name: e.user.campus.name,
            totalStreak: 0,
            studentCount: 0,
          };
        }
        campusAggregates[cId].totalStreak += e.streakCount;
        campusAggregates[cId].studentCount += 1;
      }
    });

    const campusRankings = Object.values(campusAggregates).sort(
      (a, b) => b.totalStreak - a.totalStreak
    );

    return NextResponse.json({
      individualRankings: enrollments,
      campusRankings,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
