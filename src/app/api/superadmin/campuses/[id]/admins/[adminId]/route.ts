import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { z } from "zod";

const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  year: z.coerce.number().int().min(1).max(4).nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type RouteParams = { params: Promise<{ id: string; adminId: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id: campusId, adminId } = await params;

    const body = await request.json();
    const parsed = updateAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify admin exists, is a CAMPUS_ADMIN, and belongs to this campus
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: "Campus admin not found" }, { status: 404 });
    }

    if (admin.role !== "CAMPUS_ADMIN" || admin.campusId !== campusId) {
      return NextResponse.json(
        { error: "This user is not an admin of the specified campus" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.year !== undefined) updateData.year = parsed.data.year;
    if (parsed.data.password) {
      updateData.passwordHash = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        year: true,
        campusId: true,
      },
    });

    return NextResponse.json({
      message: "Campus Admin updated successfully",
      admin: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id: campusId, adminId } = await params;

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: "Campus admin not found" }, { status: 404 });
    }

    if (admin.role !== "CAMPUS_ADMIN" || admin.campusId !== campusId) {
      return NextResponse.json(
        { error: "This user is not an admin of the specified campus" },
        { status: 400 }
      );
    }

    // Safely delete in a transaction to handle foreign key dependencies cleanly
    await prisma.$transaction([
      prisma.submission.updateMany({
        where: { reviewedById: adminId },
        data: { reviewedById: null },
      }),
      prisma.interviewApplication.updateMany({
        where: { interviewerId: adminId },
        data: { interviewerId: null },
      }),
      prisma.auditLog.deleteMany({
        where: { actorId: adminId },
      }),
      prisma.user.delete({
        where: { id: adminId },
      }),
    ]);

    return NextResponse.json({
      message: `Campus Admin ${admin.name} (${admin.email}) removed successfully`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
