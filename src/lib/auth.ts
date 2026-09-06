import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

const rawSecret =
  process.env.JWT_SECRET || "alta-dsa-platform-secret-key-change-in-production";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET.includes("change-in-production"))
) {
  console.warn(
    "⚠️ SECURITY WARNING: JWT_SECRET is using the insecure default key in production! Please set a strong, random JWT_SECRET in your production environment variables."
  );
}

const JWT_SECRET = new TextEncoder().encode(rawSecret);

const COOKIE_NAME = "alta_session";

export interface TokenPayload {
  userId: string;
  role: Role;
  campusId: string | null;
  year?: number | null;
}

// ─── Password Hashing ──────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token ──────────────────────────────────────────────────────────────

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ─── Session Management ─────────────────────────────────────────────────────

export async function setSessionCookie(payload: TokenPayload): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Extract token from a NextRequest (used in middleware)
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get the current user's session or throw
 */
export async function requireSession(): Promise<TokenPayload> {
  const session = await getSessionFromCookies();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Check if a user has the required role
 */
export function hasRole(session: TokenPayload, ...roles: Role[]): boolean {
  return roles.includes(session.role);
}

/**
 * Require specific role(s) or throw
 */
export async function requireRole(...roles: Role[]): Promise<TokenPayload> {
  const session = await requireSession();
  if (!hasRole(session, ...roles)) {
    throw new Error("Forbidden");
  }
  return session;
}
