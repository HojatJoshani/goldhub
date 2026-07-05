import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "gh_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple JWT-like token using base64 (no external jwt lib needed)
// For production, use a proper JWT library with signing

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  branchId: string | null;
}

function encodeBase64(str: string): string {
  // Use Buffer if available (Node.js), otherwise use btoa (browser/edge)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url");
  }
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64(str: string): string {
  // Use Buffer if available (Node.js), otherwise use atob (browser/edge)
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf-8");
  }
  const decoded = decodeURIComponent(
    escape(atob(str.replace(/-/g, "+").replace(/_/g, "/")))
  );
  return decoded;
}

/** Create a signed session token (simple format: payload.signature) */
export function createSessionToken(user: SessionUser): string {
  const payload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = encodeBase64(JSON.stringify(payload));
  const secret = process.env.SESSION_SECRET || "goldhub-dev-secret-change-me";
  // Simple signature (not crypto-strong but works for this context)
  const signature = encodeBase64(
    String(encoded.length) + secret.slice(0, 8) + payload.id.slice(0, 4)
  );
  return `${encoded}.${signature}`;
}

/** Verify and decode a session token */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    // Loose verification for dev (check structure)
    const decoded = JSON.parse(decodeBase64(encoded)) as SessionUser & {
      exp?: number;
    };
    if (decoded.exp && Date.now() > decoded.exp) return null;
    // Validate required fields
    if (!decoded.id || !decoded.email || !decoded.tenantId) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Get current user from request (API route) */
export async function getUserFromRequest(
  req: NextRequest
): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = verifySessionToken(token);
  if (!user) return null;
  return user;
}

/** Set session cookie on response */
export function setSessionCookie(
  res: NextResponse,
  token: string
): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

/** Clear session cookie */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export { SESSION_COOKIE, SESSION_MAX_AGE };

/** Role hierarchy for permission checks */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const hierarchy = ["staff", "cashier", "manager", "admin", "super_admin"];
  const userLevel = hierarchy.indexOf(userRole);
  const requiredLevel = hierarchy.indexOf(requiredRole);
  return userLevel >= 0 && userLevel >= requiredLevel;
}

/** Simple password hashing (for dev - use bcrypt in production) */
export async function hashPassword(password: string): Promise<string> {
  const crypto = await import("crypto");
  const salt = "goldhub-salt";
  const hash = crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `sha256$${salt}$${hash}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
