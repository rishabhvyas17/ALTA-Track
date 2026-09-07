import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateScore } from "@/lib/scoring";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId") || undefined;
    const campusId = searchParams.get("campusId") || undefined;
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

    const cacheKey = `leaderboard_${challengeId || "all"}_${campusId || "all"}_${year || "all"}`;

    const leaderboardData = await memoryCache.getOrSet(
      cacheKey,
      CACHE_TTL.LEADERBOARD,
      async () => {
        const whereClause: any = {};
        if (challengeId) whereClause.challengeId = challengeId;
        if (campusId) whereClause.user = { ...whereClause.user, campusId };
        if (year) whereClause.user = { ...whereClause.user, year };

        const rawEnrollments = await prisma.enrollment.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                year: true,
                campus: { select: { id: true, name: true, region: true } },
              },
            },
            challenge: {
              select: { id: true, name: true, totalDays: true },
            },
            submissions: {
              where: { status: "APPROVED" },
              select: {
                id: true,
                dayNumber: true,
                problem: {
                  select: {
                    difficulty: true,
                  },
                },
              },
            },
          },
        });

        // Calculate score & questions solved for each enrollment
        const allEnrollmentScores = rawEnrollments.map((e) => {
          const scoreData = calculateScore(e.submissions);
          return {
            id: e.id,
            currentDay: e.currentDay,
            streakCount: e.streakCount,
            longestStreak: e.longestStreak,
            status: e.status,
            completedAt: e.completedAt,
            updatedAt: e.updatedAt,
            score: scoreData.score,
            questionsSolved: scoreData.questionsSolved,
            easyCount: scoreData.easy,
            mediumCount: scoreData.medium,
            hardCount: scoreData.hard,
            user: e.user,
            challenge: e.challenge,
          };
        });

        // Deduplicate: keep only the best enrollment per student.
        // This handles both:
        // 1. A student enrolled in multiple challenges (BASE 111 & APEX 151) under the same account.
        // 2. A student who registered multiple accounts with different emails (e.g. personal email vs college email).
        const bestByUser = new Map<string, typeof allEnrollmentScores[0]>();
        for (const entry of allEnrollmentScores) {
          // Normalize name and campus to prevent duplicate student profiles
          const cleanName = (entry.user.name || "").trim().toLowerCase();
          const campusId = entry.user.campus?.id || "global";
          const studentKey = `${campusId}_${cleanName}`;

          const existing = bestByUser.get(studentKey);
          if (
            !existing ||
            entry.score > existing.score ||
            (entry.score === existing.score && entry.streakCount > existing.streakCount) ||
            (entry.score === existing.score && entry.streakCount === existing.streakCount && entry.questionsSolved > existing.questionsSolved)
          ) {
            // Ensure student name is nicely trimmed and title-cased if entered in lowercase
            if (entry.user.name) {
              entry.user.name = entry.user.name.trim().replace(/\b\w/g, (char) => char.toUpperCase());
            }
            bestByUser.set(studentKey, entry);
          }
        }
        const individualRankings = Array.from(bestByUser.values());

        // Rank sorting: Total Score (desc) -> Streak Count (desc) -> Current Day (desc) -> Earliest Updated (asc)
        individualRankings.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.streakCount !== a.streakCount) return b.streakCount - a.streakCount;
          if (b.currentDay !== a.currentDay) return b.currentDay - a.currentDay;
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        });

        // Grouping stats for campus-wise leaderboard view
        const campusAggregates: Record<
          string,
          {
            id: string;
            name: string;
            region?: string;
            totalScore: number;
            totalQuestionsSolved: number;
            easyCount: number;
            mediumCount: number;
            hardCount: number;
            totalStreak: number;
            studentCount: number;
          }
        > = {};

        individualRankings.forEach((e) => {
          if (e.user.campus) {
            const cId = e.user.campus.id;
            if (!campusAggregates[cId]) {
              campusAggregates[cId] = {
                id: cId,
                name: e.user.campus.name,
                region: e.user.campus.region,
                totalScore: 0,
                totalQuestionsSolved: 0,
                easyCount: 0,
                mediumCount: 0,
                hardCount: 0,
                totalStreak: 0,
                studentCount: 0,
              };
            }
            campusAggregates[cId].totalScore += e.score;
            campusAggregates[cId].totalQuestionsSolved += e.questionsSolved;
            campusAggregates[cId].easyCount += e.easyCount;
            campusAggregates[cId].mediumCount += e.mediumCount;
            campusAggregates[cId].hardCount += e.hardCount;
            campusAggregates[cId].totalStreak += e.streakCount;
            campusAggregates[cId].studentCount += 1;
          }
        });

        const campusRankings = Object.values(campusAggregates).sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          if (b.totalQuestionsSolved !== a.totalQuestionsSolved) {
            return b.totalQuestionsSolved - a.totalQuestionsSolved;
          }
          return b.totalStreak - a.totalStreak;
        });

        return {
          individualRankings,
          campusRankings,
        };
      }
    );

    return NextResponse.json(leaderboardData, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
