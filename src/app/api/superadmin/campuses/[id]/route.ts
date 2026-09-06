import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { z } from "zod";

const updateCampusSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
});

const createAdminSchema = z.object({
  action: z.literal("create_admin").optional(),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  year: z.coerce.number().int().min(1).max(4).nullable().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await request.json();

    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify campus exists
    const campus = await prisma.campus.findUnique({ where: { id } });
    if (!campus) {
      return NextResponse.json({ error: "Campus not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      if (existingUser.role === "STUDENT") {
        return NextResponse.json(
          {
            error:
              "This email is registered to a student account. Campus Admin accounts must be separate from student accounts.",
          },
          { status: 409 }
        );
      }
      if (existingUser.role === "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "This email belongs to a Super Admin account." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const admin = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "CAMPUS_ADMIN",
        campusId: id,
        year: parsed.data.year ?? null,
      },
    });

    return NextResponse.json(
      {
        message: `Campus Admin account created for ${admin.email}!`,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          year: admin.year,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const campus = await prisma.campus.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: "CAMPUS_ADMIN" },
          select: {
            id: true,
            name: true,
            email: true,
            year: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: { where: { role: "STUDENT" } },
          },
        },
      },
    });

    if (!campus) {
      return NextResponse.json(
        { error: "Campus not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;
    const body = await request.json();

    // Handle admin creation
    if (body.action === "create_admin") {
      const parsed = createAdminSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (existingUser) {
        if (existingUser.role === "STUDENT") {
          return NextResponse.json(
            {
              error:
                "This email is registered to a student account. Campus Admin accounts must be separate from student accounts.",
            },
            { status: 409 }
          );
        }
        if (existingUser.role === "SUPER_ADMIN") {
          return NextResponse.json(
            { error: "This email belongs to a Super Admin account." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(parsed.data.password);

      const admin = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
          role: "CAMPUS_ADMIN",
          campusId: id,
          year: parsed.data.year ?? null,
        },
      });

      return NextResponse.json(
        {
          message: `Campus Admin account created for ${admin.email}!`,
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            year: admin.year,
          },
        },
        { status: 201 }
      );
    }

    // Handle campus update
    const parsed = updateCampusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    if (parsed.data.name) {
      const duplicate = await prisma.campus.findFirst({
        where: { name: parsed.data.name, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A campus with this name already exists" },
          { status: 409 }
        );
      }
    }

    const campus = await prisma.campus.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ campus });
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
    const { id } = await params;
    const adminId = request.nextUrl.searchParams.get("adminId");

    // If adminId is provided, delete the specific campus admin
    if (adminId) {
      const admin = await prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin || admin.role !== "CAMPUS_ADMIN" || admin.campusId !== id) {
        return NextResponse.json(
          { error: "Campus admin not found on this campus" },
          { status: 404 }
        );
      }

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
    }

    const campus = await prisma.campus.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!campus) {
      return NextResponse.json(
        { error: "Campus not found" },
        { status: 404 }
      );
    }

    if (campus._count.users > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete a campus with existing users. Reassign users first.",
        },
        { status: 400 }
      );
    }

    await prisma.campus.delete({ where: { id } });
    return NextResponse.json({ message: "Campus deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
