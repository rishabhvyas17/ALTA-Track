import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId") || "ALL";
    const yearParam = searchParams.get("year") || "ALL";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const cacheKey = `superadmin_students_${campusId}_${yearParam}_${search}`;

    const data = await memoryCache.getOrSet(
      cacheKey,
      CACHE_TTL.SUPERADMIN_STUDENTS,
      async () => {
        const whereClause: any = {
          role: "STUDENT",
        };

        if (campusId && campusId !== "ALL") {
          whereClause.campusId = campusId;
        }

        if (yearParam && yearParam !== "ALL") {
          const parsedYear = Number(yearParam);
          if (!isNaN(parsedYear)) {
            whereClause.year = parsedYear;
          }
        }

        if (search) {
          whereClause.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ];
        }

        const students = await prisma.user.findMany({
          where: whereClause,
          include: {
            campus: {
              select: { id: true, name: true, region: true },
            },
            enrollments: {
              include: {
                challenge: {
                  select: { id: true, name: true, totalDays: true },
                },
                submissions: {
                  select: {
                    id: true,
                    status: true,
                    problem: {
                      select: { difficulty: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const studentList = students.map((stu) => {
          const allSubmissions = stu.enrollments.flatMap((e) => e.submissions);
          const approvedCount = allSubmissions.filter((s) => s.status === "APPROVED").length;
          const pendingCount = allSubmissions.filter((s) => s.status === "PENDING").length;
          const rejectedCount = allSubmissions.filter((s) => s.status === "REJECTED").length;

          const streakList = stu.enrollments.map((e) => e.streakCount);
          const longestStreakList = stu.enrollments.map((e) => e.longestStreak);
          const activeStreak = streakList.length > 0 ? Math.max(...streakList) : 0;
          const longestStreak = longestStreakList.length > 0 ? Math.max(...longestStreakList) : 0;

          // Primary track representation
          const primaryEnrollment =
            stu.enrollments.length > 0
              ? [...stu.enrollments].sort((a, b) => b.streakCount - a.streakCount)[0]
              : null;

          const trackNames = stu.enrollments.map((e) => e.challenge.name);
          const primaryTrackName =
            trackNames.length > 0
              ? trackNames.length > 1
                ? `${primaryEnrollment?.challenge?.name} (+${trackNames.length - 1} more)`
                : primaryEnrollment?.challenge?.name || "Not Enrolled"
              : "Not Enrolled";

          const overallStatus = stu.enrollments.some((e) => e.status === "ACTIVE")
            ? "ACTIVE"
            : stu.enrollments.some((e) => e.status === "COMPLETED")
            ? "COMPLETED"
            : stu.enrollments.length > 0
            ? "BROKEN"
            : "NOT_ENROLLED";

          return {
            id: stu.id,
            name: stu.name,
            email: stu.email,
            year: stu.year,
            campus: stu.campus,
            trackName: primaryTrackName,
            enrolledTracks: stu.enrollments.map((e) => ({
              challengeId: e.challenge.id,
              challengeName: e.challenge.name,
              currentDay: e.currentDay,
              totalDays: e.challenge.totalDays,
              streakCount: e.streakCount,
              longestStreak: e.longestStreak,
              status: e.status,
            })),
            currentDay: primaryEnrollment?.currentDay || 1,
            streakCount: activeStreak,
            longestStreak,
            status: overallStatus,
            totalAttempted: allSubmissions.length,
            approvedCount,
            pendingCount,
            rejectedCount,
            createdAt: stu.createdAt,
          };
        });

        return {
          total: studentList.length,
          students: studentList,
        };
      }
    );

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("SuperAdmin students route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student directory" },
      { status: 500 }
    );
  }
}

