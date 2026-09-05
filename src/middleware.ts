import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

// Routes that don't require authentication
const publicRoutes = ["/", "/api/auth/login", "/api/auth/signup"];

// Role-to-home-page mapping
const roleHomePaths: Record<string, string> = {
  STUDENT: "/dashboard",
  CAMPUS_ADMIN: "/admin",
  SUPER_ADMIN: "/superadmin",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // Unauthenticated → redirect to landing
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { role } = session;

  // Super admin routes
  if (pathname.startsWith("/superadmin")) {
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(
        new URL(roleHomePaths[role] || "/", request.url)
      );
    }
    return NextResponse.next();
  }

  // Campus admin routes
  if (pathname.startsWith("/admin")) {
    if (role !== "CAMPUS_ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(
        new URL(roleHomePaths[role] || "/", request.url)
      );
    }
    return NextResponse.next();
  }

  // Student routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/leaderboard") || pathname.startsWith("/rules") || pathname.startsWith("/onboarding")) {
    if (role !== "STUDENT" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(
        new URL(roleHomePaths[role] || "/", request.url)
      );
    }
    return NextResponse.next();
  }

  // API routes — let them handle their own auth
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
