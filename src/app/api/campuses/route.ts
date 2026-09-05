import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        region: true,
      },
    });

    return NextResponse.json({ campuses });
  } catch (error) {
    console.error("Error fetching campuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch campuses" },
      { status: 500 }
    );
  }
}
