import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { parseDsaSheetCsv } from "@/lib/dsaSheetParser";
import { z } from "zod";

const problemRowSchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().min(1),
  difficulty: z.string(),
  topic: z.string().default("General"),
  chapter: z.string().default("Foundations"),
  companies: z.string().default(""),
  externalLink: z.string().url(),
  articleLink: z.string().url().optional().nullable(),
  videoLink: z.string().url().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_ADMIN");
    const { id } = await params;

    // Verify challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const body = await request.json();
    let rowsToProcess: any[] = [];

    if (body.csvText) {
      const parsed = parseDsaSheetCsv(body.csvText);
      if (parsed.problems.length === 0) {
        return NextResponse.json(
          { error: parsed.errors[0] || "No valid problem rows found in CSV." },
          { status: 400 }
        );
      }
      rowsToProcess = parsed.problems;
    } else if (Array.isArray(body.problems)) {
      rowsToProcess = body.problems;
    } else {
      return NextResponse.json(
        { error: "Provide either 'csvText' or 'problems' array." },
        { status: 400 }
      );
    }

    // Validate and upsert all problems in a transaction
    let maxDay = 0;
    const upsertPromises = rowsToProcess.map((raw) => {
      const row = problemRowSchema.parse({
        dayNumber: Number(raw.dayNumber),
        title: String(raw.title).trim(),
        difficulty: String(raw.difficulty).trim(),
        topic: String(raw.topic || "General").trim(),
        chapter: String(raw.chapter || "Foundations").trim(),
        companies: String(raw.companies || "").trim(),
        externalLink: String(raw.externalLink).trim(),
        articleLink: raw.articleLink ? String(raw.articleLink).trim() : null,
        videoLink: raw.videoLink ? String(raw.videoLink).trim() : null,
      });

      if (row.dayNumber > maxDay) {
        maxDay = row.dayNumber;
      }

      return prisma.problem.upsert({
        where: {
          challengeId_dayNumber: {
            challengeId: id,
            dayNumber: row.dayNumber,
          },
        },
        create: {
          challengeId: id,
          dayNumber: row.dayNumber,
          title: row.title,
          difficulty: row.difficulty,
          topic: row.topic,
          chapter: row.chapter,
          companies: row.companies,
          externalLink: row.externalLink,
          articleLink: row.articleLink,
          videoLink: row.videoLink,
        },
        update: {
          title: row.title,
          difficulty: row.difficulty,
          topic: row.topic,
          chapter: row.chapter,
          companies: row.companies,
          externalLink: row.externalLink,
          articleLink: row.articleLink,
          videoLink: row.videoLink,
        },
      });
    });

    await prisma.$transaction(upsertPromises);

    // Update challenge totalDays if the uploaded sheet has more days
    if (maxDay > challenge.totalDays) {
      await prisma.challenge.update({
        where: { id },
        data: { totalDays: maxDay },
      });
    }

    return NextResponse.json({
      success: true,
      count: rowsToProcess.length,
      maxDay,
      message: `Successfully imported ${rowsToProcess.length} problems for ${challenge.name}.`,
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Error bulk uploading problems:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.errors[0]?.message} at ${error.errors[0]?.path?.join(".")}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: message || "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
