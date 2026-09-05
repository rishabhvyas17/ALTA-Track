import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";

const goodiesSchema = z.object({
  challengeId: z.string().min(1),
  shippingName: z.string().min(2),
  shippingAddress: z.string().min(5),
  phone: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("STUDENT");

    const body = await request.json();
    const validated = goodiesSchema.parse(body);

    // Check enrollment & streak eligibility
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: auth.userId,
        challengeId: validated.challengeId,
      },
      include: { challenge: true },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this challenge" },
        { status: 400 }
      );
    }

    if (enrollment.streakCount < 30) {
      return NextResponse.json(
        {
          error: `You must complete Day 30 to claim ALTA Goodies! Current streak: ${enrollment.streakCount}`,
        },
        { status: 400 }
      );
    }

    // Check if already claimed
    const existing = await prisma.goodiesClaim.findFirst({
      where: {
        userId: auth.userId,
        challengeId: validated.challengeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Goodies already claimed for this challenge", claim: existing },
        { status: 400 }
      );
    }

    const claim = await prisma.goodiesClaim.create({
      data: {
        userId: auth.userId,
        challengeId: validated.challengeId,
        shippingName: validated.shippingName,
        shippingAddress: validated.shippingAddress,
        phone: validated.phone,
        status: "CLAIMED",
        claimedAt: new Date(),
      },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error claiming goodies:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to claim goodies" },
      { status: 500 }
    );
  }
}
