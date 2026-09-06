import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireRole("CAMPUS_ADMIN", "SUPER_ADMIN");

    let campusFilter: any = {};
    let adminAssignedYear: number | null = null;

    if (auth.role === "CAMPUS_ADMIN" && auth.campusId) {
      const adminRecord = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { year: true },
      });
      adminAssignedYear = adminRecord?.year ?? null;

      if (adminAssignedYear) {
        campusFilter = {
          enrollment: {
            user: {
              campusId: auth.campusId,
              year: adminAssignedYear,
            },
          },
        };
      } else {
        campusFilter = { enrollment: { user: { campusId: auth.campusId } } };
      }
    }

    const submissions = await prisma.submission.findMany({
      where: campusFilter,
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                year: true,
                campus: { select: { name: true } },
              },
            },
            challenge: {
              select: { id: true, name: true },
            },
          },
        },
        problem: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ submissions, adminAssignedYear });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching campus submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
