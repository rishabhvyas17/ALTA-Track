import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { z } from "zod";

const createCampusSchema = z.object({
  name: z.string().min(2, "Campus name is required"),
  region: z.string().min(2, "Region is required"),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            users: { where: { role: "STUDENT" } },
          },
        },
        users: {
          where: { role: "CAMPUS_ADMIN" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ campuses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const body = await request.json();
    const parsed = createCampusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.campus.findUnique({
      where: { name: parsed.data.name },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A campus with this name already exists" },
        { status: 409 }
      );
    }

    const campus = await prisma.campus.create({
      data: parsed.data,
    });

    return NextResponse.json({ campus }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Campus Detail & Admin Management ───────────────────────────────────────

const updateCampusSchema = z.object({
  name: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
});

const createAdminSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// These are exported from a separate file but kept here for simplicity
export async function PUT(request: NextRequest) {
  // This won't be called — see [id]/route.ts instead
  return NextResponse.json({ error: "Use /api/superadmin/campuses/[id]" }, { status: 400 });
}
