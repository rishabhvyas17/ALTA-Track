import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("CAMPUS_ADMIN");

    // If campus admin has a campusId, use it; or allow super admin to pass ?campusId=...
    let campusId = auth.campusId;
    if (!campusId && auth.role === "SUPER_ADMIN") {
      campusId = request.nextUrl.searchParams.get("campusId");
    }

    if (!campusId) {
      // Fallback: pick the first campus if none is set
      const firstCampus = await prisma.campus.findFirst();
      campusId = firstCampus?.id || null;
    }

    if (!campusId) {
      return NextResponse.json({ error: "No campus assigned" }, { status: 404 });
    }

    const cacheKey = `admin_stats_${campusId}_${auth.userId}`;

    const statsData = await memoryCache.getOrSet(
      cacheKey,
      CACHE_TTL.ADMIN_STATS,
      async () => {
        // Fetch campus details and admin's year assignment in parallel
        const [campus, currentAdminUser] = await Promise.all([
          prisma.campus.findUnique({
            where: { id: campusId },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  year: true,
                  createdAt: true,
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: auth.userId },
            select: { year: true },
          }),
        ]);

        if (!campus) {
          throw new Error("Campus not found");
        }

        const adminAssignedYear = currentAdminUser?.year ?? null;

        const students = adminAssignedYear
          ? campus.users.filter((u) => u.role === "STUDENT" && u.year === adminAssignedYear)
          : campus.users.filter((u) => u.role === "STUDENT");
        const admins = campus.users.filter((u) => u.role === "CAMPUS_ADMIN");
        const studentIds = students.map((s) => s.id);

        // Fetch enrollments and submissions in parallel
        const [enrollments, submissions] = await Promise.all([
          prisma.enrollment.findMany({
            where: { userId: { in: studentIds } },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  year: true,
                },
              },
              challenge: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  totalDays: true,
                },
              },
              submissions: {
                select: {
                  id: true,
                  dayNumber: true,
                  status: true,
                  submittedAt: true,
                },
              },
            },
            orderBy: [
              { streakCount: "desc" },
              { currentDay: "desc" },
            ],
          }),
          prisma.submission.findMany({
            where: {
              enrollment: {
                userId: { in: studentIds },
              },
            },
            include: {
              enrollment: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      year: true,
                    },
                  },
                  challenge: {
                    select: { name: true },
                  },
                },
              },
              problem: {
                select: {
                  title: true,
                  topic: true,
                  difficulty: true,
                },
              },
            },
            orderBy: { submittedAt: "desc" },
          }),
        ]);

    // Metrics calculations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const submissionsToday = submissions.filter(
      (s) => new Date(s.submittedAt) >= startOfToday
    ).length;

    const pendingSubmissions = submissions.filter((s) => s.status === "PENDING");
    const approvedSubmissions = submissions.filter((s) => s.status === "APPROVED");
    const rejectedSubmissions = submissions.filter((s) => s.status === "REJECTED");

    const approvalRate = submissions.length > 0
      ? Math.round((approvedSubmissions.length / submissions.length) * 100)
      : 0;

    // Deduplicated student streaks: each student's highest active streak
    const studentBestStreak = new Map<string, number>();
    for (const e of enrollments) {
      if (e.status === "ACTIVE") {
        const prevBest = studentBestStreak.get(e.userId) ?? 0;
        if (e.streakCount > prevBest) {
          studentBestStreak.set(e.userId, e.streakCount);
        } else if (!studentBestStreak.has(e.userId)) {
          studentBestStreak.set(e.userId, e.streakCount);
        }
      }
    }

    const enrolledStudentIds = new Set(enrollments.map((e) => e.userId));
    const activeStreakerIds = new Set<string>();
    for (const [userId, streak] of studentBestStreak.entries()) {
      if (streak > 0) {
        activeStreakerIds.add(userId);
      }
    }

    const activeStreaksList = Array.from(studentBestStreak.values()).filter((s) => s > 0);
    const avgStreak = activeStreaksList.length > 0
      ? Math.round((activeStreaksList.reduce((sum, s) => sum + s, 0) / activeStreaksList.length) * 10) / 10
      : 0;

    const maxStreak = enrollments.reduce(
      (max, e) => (e.streakCount > max ? e.streakCount : max),
      0
    );

    // Difficulty breakdown of approved submissions
    const difficultyCount = { Easy: 0, Medium: 0, Hard: 0 };
    approvedSubmissions.forEach((s) => {
      const diff = s.problem?.difficulty?.toUpperCase() || "";
      if (diff.includes("EASY")) difficultyCount.Easy++;
      else if (diff.includes("HARD")) difficultyCount.Hard++;
      else difficultyCount.Medium++;
    });

    // Streak milestones deduplicated per student
    const streakMilestones = {
      streak7Plus: activeStreaksList.filter((s) => s >= 7).length,
      streak14Plus: activeStreaksList.filter((s) => s >= 14).length,
      streak25Plus: activeStreaksList.filter((s) => s >= 25).length,
      streak50Plus: activeStreaksList.filter((s) => s >= 50).length,
    };

    // Year-wise detailed breakdown
    const yearDistribution = [1, 2, 3, 4].map((yr) => {
      const yrStudents = students.filter((s) => s.year === yr);
      const yrStudentIds = new Set(yrStudents.map((s) => s.id));
      const yrEnrollments = enrollments.filter((e) => yrStudentIds.has(e.userId));
      const yrEnrolledIds = new Set(yrEnrollments.map((e) => e.userId));
      const yrActiveStreakerIds = new Set(
        yrEnrollments
          .filter((e) => e.status === "ACTIVE" && e.streakCount > 0)
          .map((e) => e.userId)
      );
      const yrSubmissions = submissions.filter((s) => yrStudentIds.has(s.enrollment.userId));
      const yrApproved = yrSubmissions.filter((s) => s.status === "APPROVED");

      const yrActiveEnrollments = yrEnrollments.filter((e) => e.status === "ACTIVE" && e.streakCount > 0);
      const yrStreakSum = yrActiveEnrollments.reduce((sum, e) => sum + e.streakCount, 0);
      const yrAvgStreak = yrActiveEnrollments.length > 0
        ? Math.round((yrStreakSum / yrActiveEnrollments.length) * 10) / 10
        : 0;

      // Student roster for this year
      const roster = yrStudents.map((stu) => {
        const studentEnrollment = enrollments.find((e) => e.userId === stu.id);
        const stuSubs = submissions.filter((s) => s.enrollment.userId === stu.id);
        const approvedCount = stuSubs.filter((s) => s.status === "APPROVED").length;
        const pendingCount = stuSubs.filter((s) => s.status === "PENDING").length;

        return {
          id: stu.id,
          name: stu.name,
          email: stu.email,
          year: stu.year,
          trackName: studentEnrollment?.challenge?.name || "Not Enrolled",
          currentDay: studentEnrollment?.currentDay || 1,
          streakCount: studentEnrollment?.streakCount || 0,
          longestStreak: studentEnrollment?.longestStreak || 0,
          status: studentEnrollment?.status || "INACTIVE",
          totalSubmissions: stuSubs.length,
          approvedCount,
          pendingCount,
          lastActiveAt: studentEnrollment?.updatedAt || stu.createdAt,
        };
      });

      return {
        year: yr,
        label: `Year ${yr}`,
        totalStudents: yrStudents.length,
        enrolledStudents: yrEnrolledIds.size,
        activeStreakers: yrActiveStreakerIds.size,
        avgStreak: yrAvgStreak,
        totalSubmissions: yrSubmissions.length,
        approvedSubmissions: yrApproved.length,
        students: roster,
      };
    });

    // All students roster (combined)
    const allStudentsRoster = students.map((stu) => {
      const studentEnrollment = enrollments.find((e) => e.userId === stu.id);
      const stuSubs = submissions.filter((s) => s.enrollment.userId === stu.id);
      const approvedCount = stuSubs.filter((s) => s.status === "APPROVED").length;
      const pendingCount = stuSubs.filter((s) => s.status === "PENDING").length;

      return {
        id: stu.id,
        name: stu.name,
        email: stu.email,
        year: stu.year,
        trackName: studentEnrollment?.challenge?.name || "Not Enrolled",
        currentDay: studentEnrollment?.currentDay || 1,
        streakCount: studentEnrollment?.streakCount || 0,
        longestStreak: studentEnrollment?.longestStreak || 0,
        status: studentEnrollment?.status || "INACTIVE",
        totalSubmissions: stuSubs.length,
        approvedCount,
        pendingCount,
        lastActiveAt: studentEnrollment?.updatedAt || stu.createdAt,
      };
    });

    // Top students of this campus (ranked by questions solved, then streak — deduplicated by student user ID)
    const bestTopStudentByUser = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        year: number | null;
        challengeName: string;
        streakCount: number;
        currentDay: number;
        status: string;
        questionsSolved: number;
      }
    >();

    for (const e of enrollments) {
      const approvedCount = e.submissions.filter((s) => s.status === "APPROVED").length;
      const existing = bestTopStudentByUser.get(e.user.id);
      const candidate = {
        id: e.user.id,
        name: e.user.name,
        email: e.user.email,
        year: e.user.year,
        challengeName: e.challenge.name,
        streakCount: e.streakCount,
        currentDay: e.currentDay,
        status: e.status,
        questionsSolved: approvedCount,
      };

      if (
        !existing ||
        candidate.questionsSolved > existing.questionsSolved ||
        (candidate.questionsSolved === existing.questionsSolved && candidate.streakCount > existing.streakCount) ||
        (candidate.questionsSolved === existing.questionsSolved &&
          candidate.streakCount === existing.streakCount &&
          candidate.currentDay > existing.currentDay)
      ) {
        bestTopStudentByUser.set(e.user.id, candidate);
      }
    }

    const topStudents = Array.from(bestTopStudentByUser.values())
      .sort((a, b) => {
        if (b.questionsSolved !== a.questionsSolved) return b.questionsSolved - a.questionsSolved;
        return b.streakCount - a.streakCount;
      })
      .slice(0, 10);

    return {
      campus: {
        id: campus.id,
        name: campus.name,
        region: campus.region,
        admins: admins.map((a) => ({ id: a.id, name: a.name, email: a.email })),
      },
      kpis: {
        totalStudents: students.length,
        enrolledStudents: enrolledStudentIds.size,
        activeStreakers: activeStreakerIds.size,
        avgStreak,
        maxStreak,
        submissionsToday,
        totalSubmissions: submissions.length,
        pendingSubmissions: pendingSubmissions.length,
        approvedSubmissions: approvedSubmissions.length,
        rejectedSubmissions: rejectedSubmissions.length,
        approvalRate,
      },
      streakMilestones,
      difficultyCount,
      yearDistribution,
      allStudents: allStudentsRoster,
      topStudents,
      adminAssignedYear,
      recentPendingSubmissions: pendingSubmissions.slice(0, 10).map((s) => ({
        id: s.id,
        dayNumber: s.dayNumber,
        problemTitle: s.problem.title,
        difficulty: s.problem.difficulty,
        topic: s.problem.topic,
        studentName: s.enrollment.user.name,
        studentEmail: s.enrollment.user.email,
        year: s.enrollment.user.year,
        challengeName: s.enrollment.challenge.name,
        submittedAt: s.submittedAt,
        linkedinPostUrl: s.linkedinPostUrl,
        githubLink: s.githubLink,
        supportingLink: s.supportingLink,
        status: s.status,
      })),
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
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Campus Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load campus statistics" },
      { status: 500 }
    );
  }
}
