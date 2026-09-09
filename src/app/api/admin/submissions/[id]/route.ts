import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { memoryCache } from "@/lib/cache";
import { z } from "zod";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("CAMPUS_ADMIN", "SUPER_ADMIN");

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = reviewSchema.parse(body);

    // If campus admin, verify submission belongs to their campus and assigned year cohort
    if (auth.role === "CAMPUS_ADMIN") {
      const existing = await prisma.submission.findUnique({
        where: { id },
        include: {
          enrollment: {
            include: { user: { select: { campusId: true, year: true } } },
          },
        },
      });

      if (!existing || existing.enrollment.user.campusId !== auth.campusId) {
        return NextResponse.json(
          { error: "Submission not found or unauthorized for this campus." },
          { status: 403 }
        );
      }

      const adminRecord = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { year: true },
      });

      if (adminRecord?.year && existing.enrollment.user.year !== adminRecord.year) {
        return NextResponse.json(
          {
            error: `You are assigned to Year ${adminRecord.year} students only and cannot review Year ${existing.enrollment.user.year || "unknown"} submissions.`,
          },
          { status: 403 }
        );
      }
    }

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedById: auth.userId,
        reviewedAt: new Date(),
      },
    });

    // Invalidate dashboard stats caches so updates reflect immediately
    memoryCache.deleteByPrefix("admin_stats_");
    memoryCache.delete("superadmin_stats");
    memoryCache.deleteByPrefix("superadmin_students_");
    memoryCache.deleteByPrefix("leaderboard_");

    return NextResponse.json({ submission });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error reviewing submission:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to review submission" },
      { status: 500 }
    );
  }
}
