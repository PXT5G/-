import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "./types";

export const SESSION_COOKIE = "mdt_session";

const DEFAULT_SECRET = "mdt-dev-secret-change-in-production";

function getSecret(): Uint8Array {
  const raw = process.env.MDT_JWT_SECRET ?? DEFAULT_SECRET;
  return new TextEncoder().encode(raw);
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "exp">,
  expiresInMinutes = 480,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  return new SignJWT({ ...payload, exp })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
