import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memoryCache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  try {
    const campuses = await memoryCache.getOrSet(
      "all_campuses",
      CACHE_TTL.CAMPUSES,
      () =>
        prisma.campus.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            region: true,
          },
        })
    );

    return NextResponse.json(
      { campuses },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching campuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch campuses" },
      { status: 500 }
    );
  }
}
