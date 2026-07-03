import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();

    if (isDiscordBotConfigured()) {
      const res = await botFetch("/api/fines", {
        method: "POST",
        body: {
          ...body,
          officer: { name: session.officer.name, callsign: session.officer.callsign },
        },
      });
      if (res.ok) return NextResponse.json({ ok: true, source: "discord-bot" });
    }

    console.info("[MDT] Fine (local):", body);
    return NextResponse.json({ ok: true, source: "local" });
  } catch {
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
