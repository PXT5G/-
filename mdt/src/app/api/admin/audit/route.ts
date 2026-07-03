import { NextRequest, NextResponse } from "next/server";
import { authErrorResponse, requireAdmin } from "@/lib/auth/guards";
import { appendAudit, getAuditLog } from "@/lib/auth/user-store";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);
    return NextResponse.json({ entries: getAuditLog(limit) });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: body.action ?? "ADMIN_ACTION",
      target: body.target,
      details: body.details,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}
