import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionPayload } from "./types";
import { hasPermission, isAdminRole } from "./permissions";
import type { Permission } from "./types";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHORIZED", 401);
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (!isAdminRole(session.role)) throw new AuthError("FORBIDDEN", 403);
  return session;
}

export async function requirePermission(perm: Permission): Promise<SessionPayload> {
  const session = await requireSession();
  if (!hasPermission(session.permissions, perm, session.role)) {
    throw new AuthError("FORBIDDEN", 403);
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.code }, { status: err.status });
  }
  return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
}
