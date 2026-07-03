import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/guards";
import { appendAudit } from "@/lib/auth/user-store";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (session) {
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: "LOGOUT",
    });
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return NextResponse.json({ ok: true });
}
