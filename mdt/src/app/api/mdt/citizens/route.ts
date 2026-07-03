import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guards";
import { botFetch, isDiscordBotConfigured } from "@/lib/discord/api-client";
import { searchDossiers, getDossierById, citizenDossiers } from "@/lib/data/doj-dossiers";
import type { SearchMode } from "@/lib/data/doj-dossiers";

/** GET /api/mdt/citizens?q=&mode= — بحث مواطن عبر Discord Bot أو mock */
export async function GET(req: Request) {
  try {
    await requireSession();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const mode = (url.searchParams.get("mode") ?? "name") as SearchMode;
    const id = url.searchParams.get("id");

    if (id) {
      if (isDiscordBotConfigured()) {
        const res = await botFetch<{ ok: boolean; citizen: unknown }>(`/api/citizens/${id}`);
        if (res.ok && res.data.citizen) {
          return NextResponse.json({ ok: true, citizen: res.data.citizen, source: "discord-bot" });
        }
      }
      const local = getDossierById(id);
      return NextResponse.json({ ok: Boolean(local), citizen: local, source: "local" });
    }

    if (isDiscordBotConfigured() && q) {
      const res = await botFetch<{ ok: boolean; results: unknown[] }>(
        `/api/citizens/search?q=${encodeURIComponent(q)}&mode=${encodeURIComponent(mode)}`,
      );
      if (res.ok) {
        return NextResponse.json({ ok: true, results: res.data.results, source: "discord-bot" });
      }
    }

    const results = q ? searchDossiers(q, mode) : citizenDossiers;
    return NextResponse.json({ ok: true, results, source: "local" });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
