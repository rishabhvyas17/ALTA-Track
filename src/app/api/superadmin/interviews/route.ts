import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateInterviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["QUEUED", "SCHEDULED", "PASSED", "FAILED"]),
  scheduledAt: z.string().optional(),
  interviewerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const applications = await prisma.interviewApplication.findMany({
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
        interviewer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole("SUPER_ADMIN");
    const body = await request.json();
    const validated = updateInterviewSchema.parse(body);

    const application = await prisma.interviewApplication.update({
      where: { id: validated.id },
      data: {
        status: validated.status,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
        interviewerId: validated.interviewerId || auth.userId,
        notes: validated.notes || undefined,
      },
    });

    return NextResponse.json({ application });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error updating interview:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}
