import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { z } from "zod";

const updateCampusSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
});

const createAdminSchema = z.object({
  action: z.literal("create_admin"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RouteParams = { params: Promise<{ id: string }> };

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

      // Check email uniqueness
      const existingUser = await prisma.user.findUnique({
        where: { email: parsed.data.email },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
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
        },
      });

      return NextResponse.json(
        {
          admin: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
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
