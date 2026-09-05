import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { ChallengeRulesSchema, DEFAULT_RULES } from "@/lib/rules";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createChallengeSchema = z.object({
  name: z.string().min(2, "Challenge name is required"),
  totalDays: z.number().int().min(1, "Must have at least 1 day"),
  rules: ChallengeRulesSchema.optional(),
  requiresCompletedChallengeId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireRole("SUPER_ADMIN");

    const challenges = await prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        requiresCompletedChallenge: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            problems: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({ challenges });
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
    const session = await requireRole("SUPER_ADMIN");

    const body = await request.json();
    const parsed = createChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, totalDays, rules, requiresCompletedChallengeId, isActive } =
      parsed.data;

    // Check for duplicate slug
    const slug = slugify(name);
    const existingChallenge = await prisma.challenge.findUnique({
      where: { slug },
    });

    if (existingChallenge) {
      return NextResponse.json(
        { error: "A challenge with a similar name already exists" },
        { status: 409 }
      );
    }

    // Validate prerequisite exists if provided
    if (requiresCompletedChallengeId) {
      const prereq = await prisma.challenge.findUnique({
        where: { id: requiresCompletedChallengeId },
      });
      if (!prereq) {
        return NextResponse.json(
          { error: "Prerequisite challenge not found" },
          { status: 400 }
        );
      }
    }

    const challenge = await prisma.challenge.create({
      data: {
        name,
        slug,
        totalDays,
        rules: rules || DEFAULT_RULES,
        requiresCompletedChallengeId: requiresCompletedChallengeId || null,
        isActive: isActive ?? true,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
