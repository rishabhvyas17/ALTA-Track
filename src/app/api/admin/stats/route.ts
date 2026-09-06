import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

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

    // Fetch campus details
    const campus = await prisma.campus.findUnique({
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
    });

    if (!campus) {
      return NextResponse.json({ error: "Campus not found" }, { status: 404 });
    }

    const students = campus.users.filter((u) => u.role === "STUDENT");
    const admins = campus.users.filter((u) => u.role === "CAMPUS_ADMIN");
    const studentIds = students.map((s) => s.id);

    // Fetch all enrollments for students of this campus
    const enrollments = await prisma.enrollment.findMany({
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
    });

    // Fetch all submissions for students of this campus
    const submissions = await prisma.submission.findMany({
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
    });

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

    const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
    const totalStreak = activeEnrollments.reduce((sum, e) => sum + e.streakCount, 0);
    const avgStreak = activeEnrollments.length > 0
      ? Math.round((totalStreak / activeEnrollments.length) * 10) / 10
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

    // Streak milestones
    const streakMilestones = {
      streak7Plus: activeEnrollments.filter((e) => e.streakCount >= 7).length,
      streak14Plus: activeEnrollments.filter((e) => e.streakCount >= 14).length,
      streak25Plus: activeEnrollments.filter((e) => e.streakCount >= 25).length,
      streak50Plus: activeEnrollments.filter((e) => e.streakCount >= 50).length,
    };

    // Year-wise detailed breakdown
    const yearDistribution = [1, 2, 3, 4].map((yr) => {
      const yrStudents = students.filter((s) => s.year === yr);
      const yrStudentIds = new Set(yrStudents.map((s) => s.id));
      const yrEnrollments = enrollments.filter((e) => yrStudentIds.has(e.userId));
      const yrActiveEnrollments = yrEnrollments.filter((e) => e.status === "ACTIVE");
      const yrSubmissions = submissions.filter((s) => yrStudentIds.has(s.enrollment.userId));
      const yrApproved = yrSubmissions.filter((s) => s.status === "APPROVED");

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
        activeStreakers: yrActiveEnrollments.length,
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

    // Top students of this campus (ranked by questions solved, then streak)
    const topStudents = enrollments
      .map((e) => {
        const approvedCount = e.submissions.filter((s) => s.status === "APPROVED").length;
        return {
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
      })
      .sort((a, b) => {
        if (b.questionsSolved !== a.questionsSolved) return b.questionsSolved - a.questionsSolved;
        return b.streakCount - a.streakCount;
      })
      .slice(0, 10);

    return NextResponse.json({
      campus: {
        id: campus.id,
        name: campus.name,
        region: campus.region,
        admins: admins.map((a) => ({ id: a.id, name: a.name, email: a.email })),
      },
      kpis: {
        totalStudents: students.length,
        activeStreakers: activeEnrollments.length,
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
