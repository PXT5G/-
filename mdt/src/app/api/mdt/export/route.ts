import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { type, data } = body as { type: "warrants" | "duty"; data: unknown };

    if (isDiscordBotConfigured()) {
      const res = await botFetch<{ ok: boolean; sent: boolean }>("/api/export", {
        method: "POST",
        body: {
          type,
          data,
          officer: {
            name: session.officer.name,
            username: session.username,
            callsign: session.officer.callsign,
          },
        },
      });
      if (res.ok) {
        return NextResponse.json({ ok: true, sent: res.data.sent, source: "discord-bot" });
      }
    }

    // Fallback: webhook مباشر أو log
    const payload = {
      embeds: [
        {
          title: type === "warrants" ? "تصدير مذكرات التوقيف" : "تصدير سجل الخدمة",
          description: `طلب من: ${session.officer.name} (${session.username})`,
          color: type === "warrants" ? 0xff3b5c : 0x22ff88,
          fields: [
            {
              name: "البيانات",
              value: "```json\n" + JSON.stringify(data, null, 2).slice(0, 900) + "\n```",
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const webhook = process.env.DISCORD_EXPORT_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return NextResponse.json({ ok: true, sent: true, source: "webhook" });
    }

    console.info("[MDT Export] local fallback:", payload);
    return NextResponse.json({ ok: true, sent: false, source: "local" });
  } catch {
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
