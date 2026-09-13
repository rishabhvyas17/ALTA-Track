import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const cacheKey = "superadmin_stats";

    const statsData = await memoryCache.getOrSet(
      cacheKey,
      CACHE_TTL.SUPERADMIN_STATS,
      async () => {
        // Parallelize all queries in a single Promise.all
        const [
          totalStudents,
          challenges,
          allEnrollments,
          allSubmissions,
          interviewApps,
          goodiesClaims,
          problemsCount,
          officialCampuses,
        ] = await Promise.all([
          prisma.user.count({ where: { role: "STUDENT" } }),
          prisma.challenge.findMany({
            include: {
              _count: { select: { problems: true, enrollments: true } },
            },
          }),
          prisma.enrollment.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  year: true,
                  campusId: true,
                  campus: { select: { name: true, region: true } },
                },
              },
              challenge: { select: { id: true, name: true, totalDays: true } },
            },
          }),
          prisma.submission.findMany({
            orderBy: { submittedAt: "desc" },
            select: {
              id: true,
              dayNumber: true,
              status: true,
              submittedAt: true,
              linkedinPostUrl: true,
              githubLink: true,
              enrollment: {
                select: {
                  userId: true,
                  user: {
                    select: {
                      name: true,
                      year: true,
                      campus: { select: { name: true } },
                    },
                  },
                  challenge: { select: { name: true } },
                },
              },
              problem: {
                select: {
                  title: true,
                  difficulty: true,
                },
              },
            },
          }),
          prisma.interviewApplication.findMany(),
          prisma.goodiesClaim.findMany(),
          prisma.problem.count(),
          prisma.campus.findMany({
            include: {
              users: {
                select: { id: true, name: true, email: true, role: true, year: true },
              },
            },
            orderBy: { name: "asc" },
          }),
        ]);

        // Active enrollments & streaks (deduplicated by student for active streakers)
        const studentBestStreak = new Map<string, number>();
        for (const e of allEnrollments) {
          if (e.status === "ACTIVE") {
            const prev = studentBestStreak.get(e.userId) ?? 0;
            if (e.streakCount > prev) {
              studentBestStreak.set(e.userId, e.streakCount);
            } else if (!studentBestStreak.has(e.userId)) {
              studentBestStreak.set(e.userId, e.streakCount);
            }
          }
        }

        const enrolledStudentIds = new Set(allEnrollments.map((e) => e.userId));
        const activeStreakerUserIds = new Set<string>();
        for (const [userId, streak] of studentBestStreak.entries()) {
          if (streak > 0) {
            activeStreakerUserIds.add(userId);
          }
        }

        const activeStreaksList = Array.from(studentBestStreak.values()).filter((s) => s > 0);
        const streak7Plus = activeStreaksList.filter((s) => s >= 7).length;
        const streak14Plus = activeStreaksList.filter((s) => s >= 14).length;
        const streak25Plus = activeStreaksList.filter((s) => s >= 25).length;
        const streak50Plus = activeStreaksList.filter((s) => s >= 50).length;

        // Submissions metrics
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const submissionsToday = allSubmissions.filter(
          (s) => new Date(s.submittedAt) >= startOfToday
        ).length;

        const approvedSubmissions = allSubmissions.filter((s) => s.status === "APPROVED");
        const pendingSubmissions = allSubmissions.filter((s) => s.status === "PENDING");
        const rejectedSubmissions = allSubmissions.filter((s) => s.status === "REJECTED");

        const approvalRate =
          allSubmissions.length > 0
            ? Math.round((approvedSubmissions.length / allSubmissions.length) * 100)
            : 0;

        // Campus Breakdown (5 Partner Campuses with deep metrics)
        const campusMetrics = officialCampuses.map((camp) => {
          const students = camp.users.filter((u) => u.role === "STUDENT");
          const admins = camp.users
            .filter((u) => u.role === "CAMPUS_ADMIN")
            .map((a) => ({ id: a.id, name: a.name, email: a.email, year: a.year }));

          const studentIds = new Set(students.map((u) => u.id));
          const campusEnrollments = allEnrollments.filter((e) => studentIds.has(e.userId));
          const campusEnrolledUserIds = new Set(campusEnrollments.map((e) => e.userId));
          const campusActiveStreakerUserIds = new Set(
            campusEnrollments
              .filter((e) => e.status === "ACTIVE" && e.streakCount > 0)
              .map((e) => e.userId)
          );

          const campusActiveEnrollments = campusEnrollments.filter(
            (e) => e.status === "ACTIVE" && e.streakCount > 0
          );

          const campusSubmissions = allSubmissions.filter((s) =>
            studentIds.has(s.enrollment.userId)
          );

          const campusApproved = campusSubmissions.filter((s) => s.status === "APPROVED");
          const campusPending = campusSubmissions.filter((s) => s.status === "PENDING");
          const campusRejected = campusSubmissions.filter((s) => s.status === "REJECTED");

          const campusApprovalRate =
            campusSubmissions.length > 0
              ? Math.round((campusApproved.length / campusSubmissions.length) * 100)
              : 0;

          const totalStreak = campusActiveEnrollments.reduce((sum, e) => sum + e.streakCount, 0);
          const avgStreak =
            campusActiveEnrollments.length > 0
              ? Math.round((totalStreak / campusActiveEnrollments.length) * 10) / 10
              : 0;

          const maxStreak = campusEnrollments.reduce(
            (max, e) => (e.streakCount > max ? e.streakCount : max),
            0
          );

          // Per-campus year distribution
          const campusYears = [1, 2, 3, 4].map((yr) => ({
            year: yr,
            label: `Year ${yr}`,
            count: students.filter((s) => s.year === yr).length,
          }));

          // Per-campus difficulty breakdown
          const campusDiff = { Easy: 0, Medium: 0, Hard: 0 };
          campusApproved.forEach((s) => {
            const d = s.problem?.difficulty?.toUpperCase() || "";
            if (d.includes("EASY")) campusDiff.Easy++;
            else if (d.includes("HARD")) campusDiff.Hard++;
            else campusDiff.Medium++;
          });

          // Top students in this campus (deduplicated by student user ID)
          const campusTopByUser = new Map<
            string,
            {
              id: string;
              name: string;
              year: number | null;
              streak: number;
              currentDay: number;
              challengeName: string;
            }
          >();

          for (const e of campusEnrollments) {
            const existing = campusTopByUser.get(e.user.id);
            if (
              !existing ||
              e.streakCount > existing.streak ||
              (e.streakCount === existing.streak && e.currentDay > existing.currentDay)
            ) {
              campusTopByUser.set(e.user.id, {
                id: e.user.id,
                name: e.user.name,
                year: e.user.year,
                streak: e.streakCount,
                currentDay: e.currentDay,
                challengeName: e.challenge.name,
              });
            }
          }

          const topStudents = Array.from(campusTopByUser.values())
            .sort((a, b) => b.streak - a.streak)
            .slice(0, 5);

          // Recent submissions from this campus
          const recentCampusSubmissions = campusSubmissions.slice(0, 5).map((s) => ({
            id: s.id,
            studentName: s.enrollment.user.name,
            dayNumber: s.dayNumber,
            problemTitle: s.problem.title,
            difficulty: s.problem.difficulty,
            status: s.status,
            submittedAt: s.submittedAt,
            linkedinPostUrl: s.linkedinPostUrl,
            githubLink: s.githubLink,
          }));

          return {
            id: camp.id,
            name: camp.name,
            region: camp.region,
            admins,
            studentCount: students.length,
            enrolledCount: campusEnrolledUserIds.size,
            totalEnrollments: campusEnrollments.length,
            activeStreakCount: campusActiveStreakerUserIds.size,
            avgStreak,
            maxStreak,
            totalSubmissions: campusSubmissions.length,
            approvedSubmissions: campusApproved.length,
            pendingSubmissions: campusPending.length,
            rejectedSubmissions: campusRejected.length,
            approvalRate: campusApprovalRate,
            yearDistribution: campusYears,
            difficultyBreakdown: campusDiff,
            topStudents,
            topStudent: topStudents[0] || null,
            recentSubmissions: recentCampusSubmissions,
          };
        });

        // 3. Year-wise Distribution
        const yearDistribution = [1, 2, 3, 4].map((yr) => {
          const yrEnrollments = allEnrollments.filter((e) => e.user.year === yr);
          const yrEnrolledUserIds = new Set(yrEnrollments.map((e) => e.userId));
          const yrActiveStreakerUserIds = new Set(
            yrEnrollments
              .filter((e) => e.status === "ACTIVE" && e.streakCount > 0)
              .map((e) => e.userId)
          );
          const yrActiveEnrollments = yrEnrollments.filter(
            (e) => e.status === "ACTIVE" && e.streakCount > 0
          );
          const avgYearStreak =
            yrActiveEnrollments.length > 0
              ? Math.round(
                  (yrActiveEnrollments.reduce((sum, e) => sum + e.streakCount, 0) /
                    yrActiveEnrollments.length) *
                    10
                ) / 10
              : 0;

          return {
            year: yr,
            label: `${yr}${yr === 1 ? "st" : yr === 2 ? "nd" : yr === 3 ? "rd" : "th"} Year`,
            totalStudents: yrEnrolledUserIds.size,
            activeCount: yrActiveStreakerUserIds.size,
            avgStreak: avgYearStreak,
          };
        });

        // 4. Difficulty Breakdown of Approved Submissions
        const difficultyCount = {
          Easy: 0,
          Medium: 0,
          Hard: 0,
        };

        approvedSubmissions.forEach((s) => {
          const diff = s.problem?.difficulty?.toUpperCase() || "";
          if (diff.includes("EASY")) difficultyCount.Easy++;
          else if (diff.includes("HARD")) difficultyCount.Hard++;
          else difficultyCount.Medium++;
        });

        // 5. Recent Submissions Feed (Last 10)
        const recentActivity = allSubmissions.slice(0, 10).map((s) => ({
          id: s.id,
          studentName: s.enrollment.user.name,
          campusName: s.enrollment.user.campus?.name || "Partner Campus",
          year: s.enrollment.user.year,
          challengeName: s.enrollment.challenge.name,
          dayNumber: s.dayNumber,
          problemTitle: s.problem.title,
          difficulty: s.problem.difficulty,
          submittedAt: s.submittedAt,
          status: s.status,
          linkedinPostUrl: s.linkedinPostUrl,
          githubLink: s.githubLink,
        }));

        return {
          summary: {
            totalStudents,
            enrolledStudents: enrolledStudentIds.size,
            totalCampuses: officialCampuses.length,
            totalChallenges: challenges.length,
            activeChallenges: challenges.filter((c) => c.isActive).length,
            totalProblems: problemsCount,
            activeEnrollments: activeStreakerUserIds.size,
            activeStreakers: activeStreakerUserIds.size,
            totalEnrollments: allEnrollments.length,
            submissionsToday,
            totalSubmissions: allSubmissions.length,
            pendingSubmissions: pendingSubmissions.length,
            approvedSubmissions: approvedSubmissions.length,
            rejectedSubmissions: rejectedSubmissions.length,
            approvalRate,
          },
          streakMilestones: {
            streak7Plus,
            streak14Plus,
            streak25Plus,
            streak50Plus,
          },
          interviews: {
            total: interviewApps.length,
            queued: interviewApps.filter((i) => i.status === "QUEUED").length,
            scheduled: interviewApps.filter((i) => i.status === "SCHEDULED").length,
            passed: interviewApps.filter((i) => i.status === "PASSED").length,
            failed: interviewApps.filter((i) => i.status === "FAILED").length,
          },
          goodies: {
            total: goodiesClaims.length,
            eligible: activeStreaksList.filter((s) => s >= 30).length,
            claimed: goodiesClaims.filter((g) => g.status === "CLAIMED").length,
            shipped: goodiesClaims.filter((g) => g.status === "SHIPPED").length,
          },
          campusMetrics,
          yearDistribution,
          difficultyCount,
          recentActivity,
        };
      }
    );

    return NextResponse.json(statsData, {
      headers: {
        "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Super Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard statistics" }, { status: 500 });
  }
}

