import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  appendAudit,
  getAccountByUsername,
  getSystemSettings,
  updateLastLogin,
  verifyPassword,
} from "@/lib/auth/user-store";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json({ error: "MISSING_CREDENTIALS" }, { status: 400 });
    }

    const settings = getSystemSettings();
    if (settings.maintenanceMode) {
      return NextResponse.json({ error: "MAINTENANCE" }, { status: 503 });
    }

    const account = getAccountByUsername(username);
    if (!account || !account.active) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    if (!verifyPassword(account, password)) {
      appendAudit({
        actorId: account.id,
        actorName: account.officer.name,
        action: "LOGIN_FAILED",
        details: `Failed login for ${username}`,
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      });
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const token = await createSessionToken(
      {
        sub: account.id,
        username: account.username,
        role: account.role,
        permissions: account.permissions,
        officer: account.officer,
      },
      settings.sessionTimeoutMinutes,
    );

    updateLastLogin(account.id);
    appendAudit({
      actorId: account.id,
      actorName: account.officer.name,
      action: "LOGIN_SUCCESS",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });

    const jar = await cookies();
    jar.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions(settings.sessionTimeoutMinutes * 60),
    );

    return NextResponse.json({
      ok: true,
      user: {
        id: account.id,
        username: account.username,
        role: account.role,
        permissions: account.permissions,
        officer: account.officer,
      },
    });
  } catch {
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
