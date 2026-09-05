import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ChallengeRulesSchema } from "@/lib/rules";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const updateChallengeSchema = z.object({
  name: z.string().min(2).optional(),
  totalDays: z.number().int().min(1).optional(),
  rules: ChallengeRulesSchema.optional(),
  requiresCompletedChallengeId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        requiresCompletedChallenge: {
          select: { id: true, name: true },
        },
        problems: {
          orderBy: { dayNumber: "asc" },
        },
        linkedInPostTemplates: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ challenge });
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
    const parsed = updateChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.challenge.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.name) {
      updateData.name = parsed.data.name;
      updateData.slug = slugify(parsed.data.name);

      // Check slug uniqueness
      const duplicate = await prisma.challenge.findFirst({
        where: { slug: updateData.slug as string, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A challenge with a similar name already exists" },
          { status: 409 }
        );
      }
    }
    if (parsed.data.totalDays !== undefined)
      updateData.totalDays = parsed.data.totalDays;
    if (parsed.data.rules !== undefined)
      updateData.rules = parsed.data.rules;
    if (parsed.data.requiresCompletedChallengeId !== undefined)
      updateData.requiresCompletedChallengeId =
        parsed.data.requiresCompletedChallengeId;
    if (parsed.data.isActive !== undefined)
      updateData.isActive = parsed.data.isActive;

    const challenge = await prisma.challenge.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ challenge });
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

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 }
      );
    }

    // Soft-delete if there are enrollments
    if (challenge._count.enrollments > 0) {
      await prisma.challenge.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Challenge archived (has existing enrollments)",
      });
    }

    // Hard delete if no enrollments
    await prisma.challenge.delete({ where: { id } });
    return NextResponse.json({ message: "Challenge deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
