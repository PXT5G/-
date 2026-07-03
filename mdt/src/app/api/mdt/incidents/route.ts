import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";
import { dispatchIncidents } from "@/lib/data/mock";

export async function GET() {
  try {
    await requireSession();

    if (isDiscordBotConfigured()) {
      const res = await botFetch<{ ok: boolean; incidents: unknown[] }>("/api/incidents");
      if (res.ok) {
        return NextResponse.json({ ok: true, incidents: res.data.incidents, source: "discord-bot" });
      }
    }

    return NextResponse.json({ ok: true, incidents: dispatchIncidents, source: "local" });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
