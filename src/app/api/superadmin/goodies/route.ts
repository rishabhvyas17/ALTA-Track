import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const updateGoodiesSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ELIGIBLE", "CLAIMED", "SHIPPED"]),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const claims = await prisma.goodiesClaim.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            campus: { select: { name: true } },
          },
        },
        challenge: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error fetching goodies claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch goodies claims" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await request.json();
    const validated = updateGoodiesSchema.parse(body);

    const claim = await prisma.goodiesClaim.update({
      where: { id: validated.id },
      data: {
        status: validated.status,
      },
    });

    return NextResponse.json({ claim });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error updating goodies claim:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update goodies claim" },
      { status: 500 }
    );
  }
}
