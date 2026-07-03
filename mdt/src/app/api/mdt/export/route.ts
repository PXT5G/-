import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";

/**
 * Export warrants or duty records to Discord DM (private) — like FiveM MDT export feature.
 * Set DISCORD_EXPORT_WEBHOOK_URL or route through your Discord Bot API.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { type, data } = body as { type: "warrants" | "duty"; data: unknown };

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
    } else {
      console.info("[MDT Export] Discord payload (no webhook configured):", payload);
    }

    // Discord Bot API: POST /export/dm — send privately to officer's Discord DM
    return NextResponse.json({ ok: true, sent: Boolean(webhook) });
  } catch {
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
