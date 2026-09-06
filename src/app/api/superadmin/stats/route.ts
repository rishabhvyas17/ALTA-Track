import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    // 1. Core KPIs
    const [
      totalStudents,
      totalCampuses,
      challenges,
      allEnrollments,
      allSubmissions,
      interviewApps,
      goodiesClaims,
      problemsCount,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.campus.count(),
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
        include: {
          enrollment: {
            include: {
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
              topic: true,
              chapter: true,
            },
          },
        },
      }),
      prisma.interviewApplication.findMany(),
      prisma.goodiesClaim.findMany(),
      prisma.problem.count(),
    ]);

    // Active enrollments & streaks
    const activeEnrollments = allEnrollments.filter((e) => e.status === "ACTIVE");
    const streak7Plus = activeEnrollments.filter((e) => e.streakCount >= 7).length;
    const streak14Plus = activeEnrollments.filter((e) => e.streakCount >= 14).length;
    const streak25Plus = activeEnrollments.filter((e) => e.streakCount >= 25).length;
    const streak50Plus = activeEnrollments.filter((e) => e.streakCount >= 50).length;

    // Submissions metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const submissionsToday = allSubmissions.filter(
      (s) => new Date(s.submittedAt) >= startOfToday
    ).length;

    const approvedSubmissions = allSubmissions.filter((s) => s.status === "APPROVED");
    const pendingSubmissions = allSubmissions.filter((s) => s.status === "PENDING");
    const rejectedSubmissions = allSubmissions.filter((s) => s.status === "REJECTED");

    const approvalRate = allSubmissions.length > 0
      ? Math.round((approvedSubmissions.length / allSubmissions.length) * 100)
      : 0;

    // 2. Campus Breakdown (Strictly 5 Partner Campuses with deep metrics)
    const officialCampuses = await prisma.campus.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, year: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const campusMetrics = officialCampuses.map((camp) => {
      const students = camp.users.filter((u) => u.role === "STUDENT");
      const admins = camp.users
        .filter((u) => u.role === "CAMPUS_ADMIN")
        .map((a) => ({ id: a.id, name: a.name, email: a.email }));

      const studentIds = new Set(students.map((u) => u.id));
      const campusEnrollments = allEnrollments.filter((e) => studentIds.has(e.userId));
      const campusActiveEnrollments = campusEnrollments.filter((e) => e.status === "ACTIVE");

      const campusSubmissions = allSubmissions.filter((s) =>
        studentIds.has(s.enrollment.userId)
      );

      const campusApproved = campusSubmissions.filter((s) => s.status === "APPROVED");
      const campusPending = campusSubmissions.filter((s) => s.status === "PENDING");
      const campusRejected = campusSubmissions.filter((s) => s.status === "REJECTED");

      const campusApprovalRate = campusSubmissions.length > 0
        ? Math.round((campusApproved.length / campusSubmissions.length) * 100)
        : 0;

      const totalStreak = campusActiveEnrollments.reduce((sum, e) => sum + e.streakCount, 0);
      const avgStreak = campusActiveEnrollments.length > 0
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

      // Top students in this campus
      const topStudents = [...campusEnrollments]
        .sort((a, b) => b.streakCount - a.streakCount)
        .slice(0, 5)
        .map((e) => ({
          id: e.user.id,
          name: e.user.name,
          year: e.user.year,
          streak: e.streakCount,
          currentDay: e.currentDay,
          challengeName: e.challenge.name,
        }));

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
        enrolledCount: campusEnrollments.length,
        activeStreakCount: campusActiveEnrollments.length,
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
      const yearStudents = allEnrollments.filter((e) => e.user.year === yr);
      const activeYear = yearStudents.filter((e) => e.status === "ACTIVE");
      const avgYearStreak = activeYear.length > 0
        ? Math.round(
            (activeYear.reduce((sum, e) => sum + e.streakCount, 0) / activeYear.length) * 10
          ) / 10
        : 0;

      return {
        year: yr,
        label: `${yr}${yr === 1 ? "st" : yr === 2 ? "nd" : yr === 3 ? "rd" : "th"} Year`,
        totalStudents: yearStudents.length,
        activeCount: activeYear.length,
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

    return NextResponse.json({
      summary: {
        totalStudents,
        totalCampuses: officialCampuses.length,
        totalChallenges: challenges.length,
        activeChallenges: challenges.filter((c) => c.isActive).length,
        totalProblems: problemsCount,
        activeEnrollments: activeEnrollments.length,
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
        eligible: activeEnrollments.filter((e) => e.streakCount >= 30).length,
        claimed: goodiesClaims.filter((g) => g.status === "CLAIMED").length,
        shipped: goodiesClaims.filter((g) => g.status === "SHIPPED").length,
      },
      campusMetrics,
      yearDistribution,
      difficultyCount,
      recentActivity,
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
