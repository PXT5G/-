import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { appendAudit } from "@/lib/auth/user-store";
import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";

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

    if (isDiscordBotConfigured()) {
      await botFetch("/api/duty", {
        method: "POST",
        body: {
          action,
          officer: session.officer,
          department: session.officer.department,
          callsign: session.officer.callsign,
        },
      });
    }

    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
