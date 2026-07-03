import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { appendAudit } from "@/lib/auth/user-store";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const action = body.action as "on_duty" | "off_duty";

    appendAudit({
      actorId: session.sub,
      actorName: session.officer.name,
      action: action === "on_duty" ? "DUTY_ON" : "DUTY_OFF",
      details: `${session.officer.callsign} — ${session.officer.department}`,
    });

    // Discord Bot API: POST /duty-logs — mirror FiveM auto duty tracking
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
